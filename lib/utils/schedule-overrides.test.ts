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
	scheduleMoveAction,
	startOfWeek,
} from './schedule-week'

// Wednesday 16 Sep 2026. The split trains Monday, Wednesday and Friday.
const NOW = new Date(2026, 8, 16, 12, 0)
const WEEK = startOfWeek(NOW)

const split = (overrides: Partial<Routine> = {}): Routine => ({
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
	...overrides,
})

const move = (id: string, date: string, toDate: string): ScheduleOverride => ({
	id,
	routineId: 'split',
	date,
	kind: 'MOVE',
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
	routine = split(),
) =>
	buildScheduleWeek({
		weekStart: WEEK,
		now: NOW,
		routines: [routine],
		sessions,
		overrides,
	})

const entriesOn = (week: ReturnType<typeof build>, date: number) =>
	week.days
		.find(d => d.date === localDateKey(new Date(2026, 8, date)))!
		.entries.map(e =>
			e.kind === 'SESSION'
				? `${e.status}:${e.dayName}`
				: e.kind === 'MOVED'
					? `MOVED:${e.dayName}→${e.toDate}`
					: `${e.kind}:${e.dayName}${'movedFrom' in e && e.movedFrom ? `<${e.movedFrom}` : ''}`,
		)

describe('moving one planned workout (SCHED-04)', () => {
	it('shows the planned day as moved and the workout on its new date', () => {
		const week = build([move('o1', '2026-09-16', '2026-09-17')])
		expect(entriesOn(week, 16)).toEqual(['MOVED:Lower→2026-09-17'])
		expect(entriesOn(week, 17)).toEqual(['PLANNED:Lower<2026-09-16'])
		expect(entriesOn(week, 18)).toEqual(['PLANNED:Full'])
		expect(week.totals).toMatchObject({ planned: 2, notLogged: 1, moved: 1 })
		expect(describeScheduleTotals(week.totals)).toMatch(/1 moved$/)

		const thursday = week.days.find(d => d.date === '2026-09-17')!
		expect(thursday.entries[0]).toMatchObject({
			routineDayId: 'wed',
			occurrenceDate: '2026-09-16',
			overrideId: 'o1',
		})
	})

	it('lets a session on either date complete the occurrence', () => {
		const moved = [move('o1', '2026-09-16', '2026-09-17')]
		const onTarget = build(moved, [done(17)])
		expect(entriesOn(onTarget, 17)).toEqual(['COMPLETED:Lower'])
		expect(entriesOn(onTarget, 16)).toEqual(['MOVED:Lower→2026-09-17'])

		const onOriginal = build(moved, [done(16)])
		expect(entriesOn(onOriginal, 16)).toEqual(['COMPLETED:Lower'])
		expect(entriesOn(onOriginal, 17)).toEqual([])
	})

	it('replaces a rest day, passes into "not logged" and ignores stale moves', () => {
		const restful = split({ restDays: [6] })
		const onRest = build([move('o1', '2026-09-18', '2026-09-19')], [], restful)
		expect(entriesOn(onRest, 19)).toEqual(['PLANNED:Full<2026-09-18'])

		const past = build([move('o1', '2026-09-14', '2026-09-15')])
		expect(entriesOn(past, 14)).toEqual(['MOVED:Upper→2026-09-15'])
		expect(entriesOn(past, 15)).toEqual(['NOT_LOGGED:Upper<2026-09-14'])

		// Tuesday is no longer a training day: the move has nothing to move.
		const stale = build([move('o1', '2026-09-15', '2026-09-17')])
		expect(entriesOn(stale, 17)).toEqual([])
	})

	it('offers Move on future planned days and Undo on moved ones', () => {
		const week = build([move('o1', '2026-09-16', '2026-09-17')])
		const day = (date: number) =>
			week.days.find(d => d.date === localDateKey(new Date(2026, 8, date)))!
		expect(scheduleMoveAction(day(18).entries[0], day(18), NOW)).toEqual({
			kind: 'MOVE',
			routineId: 'split',
			occurrenceDate: '2026-09-18',
			currentDate: '2026-09-18',
			overrideId: null,
		})
		expect(scheduleMoveAction(day(17).entries[0], day(17), NOW)).toMatchObject({
			kind: 'MOVE',
			occurrenceDate: '2026-09-16',
			currentDate: '2026-09-17',
			overrideId: 'o1',
		})
		expect(scheduleMoveAction(day(16).entries[0], day(16), NOW)).toEqual({
			kind: 'UNDO',
			overrideId: 'o1',
		})
		// Monday has passed: nothing to move, but it can be marked skipped.
		expect(scheduleMoveAction(day(14).entries[0], day(14), NOW)).toMatchObject({
			kind: 'SKIP',
			occurrenceDate: '2026-09-14',
		})

		// Moved from a day that has since passed: it can only be put back.
		const later = build([move('o2', '2026-09-14', '2026-09-17')])
		const thursday = later.days.find(d => d.date === '2026-09-17')!
		expect(scheduleMoveAction(thursday.entries[0], thursday, NOW)).toEqual({
			kind: 'UNDO',
			overrideId: 'o2',
		})
	})

	it('offers free days within six days, from today on', () => {
		const targets = (overrides: ScheduleOverride[] = []) =>
			moveTargets({
				occurrenceDate: '2026-09-16',
				now: NOW,
				routine: split(),
				overrides,
			})
		// Friday 18 and Monday 21 already have a workout of the split.
		expect(targets()).toEqual([
			'2026-09-17',
			'2026-09-19',
			'2026-09-20',
			'2026-09-22',
		])
		// Friday's own workout moved to Saturday: Friday frees up, Saturday is taken.
		expect(targets([move('o3', '2026-09-18', '2026-09-19')])).toEqual([
			'2026-09-17',
			'2026-09-18',
			'2026-09-20',
			'2026-09-22',
		])
	})

	it('marks a moved-away day in the month', () => {
		const month = buildScheduleMonth({
			monthStart: startOfMonth(NOW),
			now: NOW,
			routines: [split()],
			sessions: [],
			overrides: [move('o1', '2026-09-23', '2026-09-24')],
		})
		const cell = (date: string) =>
			month.weeks.flat().find(c => c.date === date)!
		expect(cell('2026-09-23').state).toBe('MOVED')
		expect(cell('2026-09-24').state).toBe('PLANNED')
		expect(month.totals.moved).toBe(1)
	})
})
