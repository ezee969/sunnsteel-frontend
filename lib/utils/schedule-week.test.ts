import type { Routine, WorkoutSessionSummary } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildScheduleWeek,
	describeScheduleTotals,
	describeWeek,
	localDateKey,
	scheduleWeekRange,
	startOfWeek,
} from './schedule-week'

// Wednesday 16 Sep 2026, local time.
const NOW = new Date(2026, 8, 16, 12, 0)
const WEEK = startOfWeek(NOW)
const at = (day: number, hour = 18) =>
	new Date(2026, 8, day, hour).toISOString()

const routine = (overrides: Partial<Routine>): Routine => ({
	id: 'upper-lower',
	userId: 'u',
	name: 'Upper / Lower',
	description: null,
	isPeriodized: false,
	isFavorite: false,
	isCompleted: false,
	scheduleMode: 'WEEKLY',
	nextRotationDayId: null,
	createdAt: new Date(2026, 8, 1).toISOString(),
	updatedAt: new Date(2026, 8, 1).toISOString(),
	days: [
		{ id: 'mon', dayOfWeek: 1, name: 'Upper', order: 0, exercises: [] },
		{ id: 'tue', dayOfWeek: 2, name: null, order: 1, exercises: [] },
		{ id: 'fri', dayOfWeek: 5, name: 'Lower', order: 2, exercises: [] },
	],
	...overrides,
})

const session = (
	id: string,
	routineId: string,
	startedAt: string,
	status: WorkoutSessionSummary['status'] = 'COMPLETED',
	dayName: string | null = null,
): WorkoutSessionSummary => ({
	id,
	status,
	startedAt,
	endedAt: startedAt,
	routine: { id: routineId, name: routineId, dayName },
})

const entriesOn = (week: ReturnType<typeof buildScheduleWeek>, date: number) =>
	week.days
		.find(d => d.date === localDateKey(new Date(2026, 8, date)))!
		.entries.map(e =>
			e.kind === 'SESSION'
				? `${e.status}:${e.dayName}`
				: `${e.kind}:${e.dayName}`,
		)

describe('schedule week', () => {
	it('starts on Monday and reads one day past the week', () => {
		expect(localDateKey(WEEK)).toBe('2026-09-14')
		const { from, to } = scheduleWeekRange(WEEK)
		expect(new Date(from).getDate()).toBe(14)
		expect(new Date(to).getDate()).toBe(22)
	})

	it('plans weekly days, logs sessions on their start date and never says missed', () => {
		const week = buildScheduleWeek({
			weekStart: WEEK,
			now: NOW,
			routines: [routine({})],
			sessions: [
				session('s1', 'upper-lower', at(14), 'COMPLETED', 'Upper'),
				// Started Wednesday before midnight, ended Thursday: stays Wednesday.
				session('s2', 'other', at(16, 23), 'ABORTED', 'Day B'),
			],
		})
		expect(entriesOn(week, 14)).toEqual(['COMPLETED:Upper'])
		expect(entriesOn(week, 15)).toEqual(['NOT_LOGGED:Tuesday'])
		expect(entriesOn(week, 16)).toEqual(['ABORTED:Day B'])
		expect(entriesOn(week, 18)).toEqual(['PLANNED:Lower'])
		expect(entriesOn(week, 20)).toEqual([])
		expect(week.days.find(d => d.isToday)?.date).toBe('2026-09-16')
		expect(week.totals).toEqual({
			completed: 1,
			aborted: 1,
			planned: 1,
			notLogged: 1,
		})
		expect(describeScheduleTotals(week.totals)).toBe(
			'1 completed · 1 ended early · 1 planned · 1 not logged',
		)
	})

	it('plans nothing before a routine existed, nor for archived routines', () => {
		const week = buildScheduleWeek({
			weekStart: WEEK,
			now: NOW,
			routines: [
				routine({ createdAt: new Date(2026, 8, 15, 9).toISOString() }),
				routine({ id: 'old', isCompleted: true }),
			],
			sessions: [],
		})
		expect(entriesOn(week, 14)).toEqual([])
		expect(entriesOn(week, 15)).toEqual(['NOT_LOGGED:Tuesday'])
	})

	it('notes the next rotation day without dating it, and shows the live session', () => {
		const rotation = routine({
			id: 'ppl',
			name: 'PPL',
			scheduleMode: 'ROTATION',
			nextRotationDayId: 'pull',
			days: [
				{ id: 'push', dayOfWeek: null, name: 'Push', order: 0, exercises: [] },
				{ id: 'pull', dayOfWeek: null, name: 'Pull', order: 1, exercises: [] },
			],
		})
		const week = buildScheduleWeek({
			weekStart: WEEK,
			now: NOW,
			routines: [rotation],
			sessions: [session('s1', 'ppl', at(15), 'COMPLETED', 'Push')],
			active: {
				id: 'live',
				status: 'IN_PROGRESS',
				startedAt: at(16, 11),
				routineId: 'ppl',
				routine: { id: 'ppl', name: 'PPL' },
				routineDay: { id: 'pull', name: 'Pull', order: 1, exercises: [] },
			},
		})
		expect(week.rotations).toEqual([
			{ routineId: 'ppl', routineName: 'PPL', nextDayName: 'Pull' },
		])
		expect(entriesOn(week, 15)).toEqual(['COMPLETED:Push'])
		expect(entriesOn(week, 16)).toEqual(['IN_PROGRESS:Pull'])
		expect(week.totals.planned + week.totals.notLogged).toBe(0)

		const lastWeek = buildScheduleWeek({
			weekStart: new Date(2026, 8, 7),
			now: NOW,
			routines: [rotation],
			sessions: [],
		})
		expect(lastWeek.rotations).toEqual([])
	})

	it('names the week relative to today', () => {
		expect(describeWeek('2026-09-14', NOW)).toBe('This week')
		expect(describeWeek('2026-09-07', NOW)).toBe('Last week')
		expect(describeWeek('2026-09-21', NOW)).toBe('Next week')
		expect(describeWeek('2026-08-31', NOW)).toMatch(/^Week of /)
		expect(
			describeScheduleTotals({
				completed: 0,
				aborted: 0,
				planned: 0,
				notLogged: 0,
			}),
		).toBe('Nothing planned or logged')
	})
})
