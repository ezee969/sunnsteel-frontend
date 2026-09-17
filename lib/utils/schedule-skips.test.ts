import type {
	Routine,
	ScheduleOverride,
	WorkoutSessionSummary,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { buildScheduleMonth, startOfMonth } from './schedule-month'
import {
	buildScheduleWeek,
	describeScheduleTotals,
	localDateKey,
	moveTargets,
	postponeTarget,
	scheduleMoveAction,
	startOfWeek,
} from './schedule-week'

// Wednesday 16 Sep 2026. The split trains Monday, Wednesday and Friday.
const NOW = new Date(2026, 8, 16, 12, 0)
const WEEK = startOfWeek(NOW)

const split: Routine = {
	id: 'split',
	userId: 'u',
	name: 'Split',
	description: null,
	isPeriodized: false,
	isFavorite: false,
	isCompleted: false,
	scheduleMode: 'WEEKLY',
	nextRotationDayId: null,
	restDays: [],
	rotationWeekdays: [],
	visibility: 'PRIVATE',
	createdAt: new Date(2026, 8, 1).toISOString(),
	updatedAt: new Date(2026, 8, 1).toISOString(),
	days: [
		{ id: 'mon', dayOfWeek: 1, name: 'Upper', order: 0, exercises: [] },
		{ id: 'wed', dayOfWeek: 3, name: 'Lower', order: 1, exercises: [] },
		{ id: 'fri', dayOfWeek: 5, name: 'Full', order: 2, exercises: [] },
	],
}

const override = (
	id: string,
	date: string,
	kind: ScheduleOverride['kind'],
	toDate: string | null = null,
): ScheduleOverride => ({
	id,
	routineId: 'split',
	date,
	kind,
	toDate,
	createdAt: new Date(2026, 8, 15).toISOString(),
})

const done = (day: number): WorkoutSessionSummary => ({
	id: `s-${day}`,
	status: 'COMPLETED',
	startedAt: new Date(2026, 8, day, 18).toISOString(),
	endedAt: new Date(2026, 8, day, 19).toISOString(),
	routine: { id: 'split', name: 'Split', dayName: 'Lower' },
})

const build = (
	overrides: ScheduleOverride[],
	sessions: WorkoutSessionSummary[] = [],
) =>
	buildScheduleWeek({
		weekStart: WEEK,
		now: NOW,
		routines: [split],
		sessions,
		overrides,
	})

const day = (week: ReturnType<typeof build>, date: number) =>
	week.days.find(d => d.date === localDateKey(new Date(2026, 8, date)))!

const kinds = (week: ReturnType<typeof build>, date: number) =>
	day(week, date).entries.map(e =>
		e.kind === 'SESSION'
			? `${e.status}:${e.dayName}`
			: `${e.kind}:${e.dayName}`,
	)

describe('skipping a planned workout (SCHED-05)', () => {
	it('reads skipped, never not logged, and a session still counts', () => {
		const week = build([
			override('o1', '2026-09-14', 'SKIP'),
			override('o2', '2026-09-18', 'SKIP'),
		])
		expect(kinds(week, 14)).toEqual(['SKIPPED:Upper'])
		expect(kinds(week, 18)).toEqual(['SKIPPED:Full'])
		expect(week.totals).toMatchObject({ notLogged: 0, planned: 1, skipped: 2 })
		expect(describeScheduleTotals(week.totals)).toMatch(/2 skipped$/)

		const trained = build([override('o2', '2026-09-18', 'SKIP')], [done(18)])
		expect(kinds(trained, 18)).toEqual(['COMPLETED:Lower'])
	})

	it('offers Undo on a skip and Mark skipped on recent passed days only', () => {
		const week = build([override('o1', '2026-09-18', 'SKIP')])
		expect(
			scheduleMoveAction(day(week, 18).entries[0], day(week, 18), NOW),
		).toEqual({
			kind: 'UNDO',
			overrideId: 'o1',
		})
		// Monday passed without a session: it can still be marked skipped.
		expect(
			scheduleMoveAction(day(week, 14).entries[0], day(week, 14), NOW),
		).toEqual({
			kind: 'SKIP',
			routineId: 'split',
			occurrenceDate: '2026-09-14',
		})
		// Six days back is the limit; a week earlier is not.
		const earlier = buildScheduleWeek({
			weekStart: new Date(2026, 8, 7),
			now: NOW,
			routines: [split],
			sessions: [],
			overrides: [],
		})
		const monday = earlier.days[0]
		const friday = earlier.days[4]
		expect(scheduleMoveAction(monday.entries[0], monday, NOW)).toBeNull()
		expect(scheduleMoveAction(friday.entries[0], friday, NOW)).toMatchObject({
			kind: 'SKIP',
			occurrenceDate: '2026-09-11',
		})
	})

	it('frees a skipped day for a move and postpones to the next free day', () => {
		const targets = moveTargets({
			occurrenceDate: '2026-09-16',
			now: NOW,
			routine: split,
			overrides: [override('o1', '2026-09-18', 'SKIP')],
		})
		expect(targets).toEqual([
			'2026-09-17',
			'2026-09-18',
			'2026-09-19',
			'2026-09-20',
			'2026-09-22',
		])
		expect(postponeTarget(targets, '2026-09-16')).toBe('2026-09-17')
		expect(postponeTarget(targets, '2026-09-20')).toBe('2026-09-22')
		expect(postponeTarget(targets, '2026-09-22')).toBeNull()
	})

	it('marks a skipped day in the month', () => {
		const month = buildScheduleMonth({
			monthStart: startOfMonth(NOW),
			now: NOW,
			routines: [split],
			sessions: [],
			overrides: [override('o1', '2026-09-23', 'SKIP')],
		})
		const cell = month.weeks.flat().find(c => c.date === '2026-09-23')!
		expect(cell.state).toBe('SKIPPED')
		expect(month.totals.skipped).toBe(1)
	})
})
