import type { Routine, WorkoutSessionSummary } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	buildWeekStrip,
	describeWeekStripToday,
	WEEK_STRIP_SCHEDULE_HREF,
	weekStripHref,
	weekStripStates,
} from './dashboard-week'
import { scheduleDayState } from './schedule-month'
import { buildScheduleWeek, localDateKey, startOfWeek } from './schedule-week'

// Wednesday 16 Sep 2026, local time.
const NOW = new Date(2026, 8, 16, 12, 0)
const at = (day: number, hour = 18) =>
	new Date(2026, 8, day, hour).toISOString()

const routine: Routine = {
	id: 'upper-lower',
	userId: 'u',
	name: 'Upper / Lower',
	description: null,
	isPeriodized: false,
	isFavorite: false,
	isCompleted: false,
	scheduleMode: 'WEEKLY',
	nextRotationDayId: null,
	restDays: [0],
	rotationWeekdays: [],
	visibility: 'PRIVATE',
	createdAt: new Date(2026, 8, 1).toISOString(),
	updatedAt: new Date(2026, 8, 1).toISOString(),
	days: [
		{ id: 'mon', dayOfWeek: 1, name: 'Upper', order: 0, exercises: [] },
		{ id: 'tue', dayOfWeek: 2, name: 'Lower', order: 1, exercises: [] },
		{ id: 'wed', dayOfWeek: 3, name: 'Upper', order: 2, exercises: [] },
		{ id: 'fri', dayOfWeek: 5, name: 'Lower', order: 3, exercises: [] },
	],
}

const session = (
	id: string,
	startedAt: string,
	status: WorkoutSessionSummary['status'] = 'COMPLETED',
): WorkoutSessionSummary => ({
	id,
	status,
	startedAt,
	endedAt: startedAt,
	routine: { id: routine.id, name: routine.name, dayName: null },
})

const week = (
	sessions: WorkoutSessionSummary[],
	active?: WorkoutSessionSummary,
) =>
	buildScheduleWeek({
		weekStart: startOfWeek(NOW),
		now: NOW,
		routines: [routine],
		sessions,
		active: active as never,
		overrides: [],
	})

const dayOf = (strip: ReturnType<typeof buildWeekStrip>, date: number) =>
	strip.find(day => day.date === localDateKey(new Date(2026, 8, date)))!

describe('weekly training strip', () => {
	it('shows the week builder’s seven days with the month view’s state', () => {
		const built = week([session('s-mon', at(14))])
		const strip = buildWeekStrip(built)
		expect(strip.map(day => day.weekday)).toEqual([
			'Mon',
			'Tue',
			'Wed',
			'Thu',
			'Fri',
			'Sat',
			'Sun',
		])
		// The same state the schedule's month cell would show for each day.
		expect(strip.map(day => day.state)).toEqual(
			built.days.map(day => scheduleDayState(day)),
		)
		expect(strip.map(day => day.state)).toEqual([
			'COMPLETED',
			'NOT_LOGGED',
			'PLANNED',
			'EMPTY',
			'PLANNED',
			'EMPTY',
			'REST',
		])
		expect(dayOf(strip, 16).isToday).toBe(true)
		expect(dayOf(strip, 16).dayOfMonth).toBe(16)
	})

	it('opens a day’s workout, else the schedule', () => {
		const strip = buildWeekStrip(
			week([session('s-mon', at(14)), session('s-tue', at(15), 'ABORTED')]),
		)
		expect(dayOf(strip, 14).href).toBe('/workouts/history/s-mon')
		expect(dayOf(strip, 14).label).toMatch(/Opens the workout\.$/)
		expect(dayOf(strip, 15).href).toBe('/workouts/history/s-tue')
		expect(dayOf(strip, 16).href).toBe(WEEK_STRIP_SCHEDULE_HREF)
		expect(dayOf(strip, 16).label).toMatch(
			/today: 1 planned\. Opens the schedule\.$/,
		)
	})

	it('prefers the live session, then the latest completed workout of a day', () => {
		const entries = [
			session('early', at(16, 7), 'ABORTED'),
			session('first', at(16, 9)),
			session('second', at(16, 11)),
		].map(s => ({
			kind: 'SESSION' as const,
			status: s.status as 'COMPLETED' | 'ABORTED',
			sessionId: s.id,
			routineId: routine.id,
			routineName: routine.name,
			dayName: null,
			startedAt: s.startedAt,
		}))
		expect(weekStripHref({ entries })).toBe('/workouts/history/second')
		expect(
			weekStripHref({
				entries: [
					...entries,
					{ ...entries[0], status: 'IN_PROGRESS', sessionId: 'live' },
				],
			}),
		).toBe('/workouts/sessions/live')
		expect(weekStripHref({ entries: [entries[0]] })).toBe(
			'/workouts/history/early',
		)
	})

	it('lists only the states the week shows, in legend order', () => {
		const strip = buildWeekStrip(week([session('s-mon', at(14))]))
		expect(weekStripStates(strip)).toEqual([
			'COMPLETED',
			'PLANNED',
			'NOT_LOGGED',
			'REST',
		])
	})

	it('states today from the today read, and nothing when today has nothing', () => {
		expect(
			describeWeekStripToday({
				hasActiveSession: true,
				remaining: 2,
				trainedToday: false,
			}),
		).toBe('Today: a workout is in progress.')
		expect(
			describeWeekStripToday({
				hasActiveSession: false,
				remaining: 1,
				trainedToday: true,
			}),
		).toBe('Today: 1 workout left to train.')
		expect(
			describeWeekStripToday({
				hasActiveSession: false,
				remaining: 2,
				trainedToday: false,
			}),
		).toBe('Today: 2 workouts left to train.')
		expect(
			describeWeekStripToday({
				hasActiveSession: false,
				remaining: 0,
				trainedToday: true,
			}),
		).toBe('Today: trained.')
		expect(
			describeWeekStripToday({
				hasActiveSession: false,
				remaining: 0,
				trainedToday: false,
			}),
		).toBeNull()
	})
})
