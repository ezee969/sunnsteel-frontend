import type { Routine, WorkoutSessionSummary } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { describeRoutineSchedule } from './routine-schedule'
import { compareRoutineSetups, routineSetup } from './routine-versions'
import {
	buildScheduleWeek,
	localDateKey,
	scheduleEntryAction,
	startOfWeek,
} from './schedule-week'

// Wednesday 16 Sep 2026, local time. PPL trains Monday, Wednesday, Friday.
const NOW = new Date(2026, 8, 16, 12, 0)
const THIS_WEEK = startOfWeek(NOW)
const NEXT_WEEK = new Date(2026, 8, 21)
const at = (day: number, hour = 18) =>
	new Date(2026, 8, day, hour).toISOString()

const ppl = (overrides: Partial<Routine> = {}): Routine => ({
	id: 'ppl',
	userId: 'u',
	name: 'PPL',
	description: null,
	isPeriodized: false,
	isFavorite: false,
	isCompleted: false,
	scheduleMode: 'ROTATION',
	nextRotationDayId: 'pull',
	restDays: [],
	rotationWeekdays: [1, 3, 5],
	createdAt: new Date(2026, 8, 1).toISOString(),
	updatedAt: new Date(2026, 8, 1).toISOString(),
	days: [
		{ id: 'push', dayOfWeek: null, name: 'Push', order: 0, exercises: [] },
		{ id: 'pull', dayOfWeek: null, name: 'Pull', order: 1, exercises: [] },
		{ id: 'legs', dayOfWeek: null, name: 'Legs', order: 2, exercises: [] },
	],
	...overrides,
})

const done = (day: number, dayName: string): WorkoutSessionSummary => ({
	id: `s-${day}`,
	status: 'COMPLETED',
	startedAt: at(day),
	endedAt: at(day),
	routine: { id: 'ppl', name: 'PPL', dayName },
})

const entriesOn = (week: ReturnType<typeof buildScheduleWeek>, date: number) =>
	week.days
		.find(d => d.date === localDateKey(new Date(2026, 8, date)))!
		.entries.map(e =>
			e.kind === 'SESSION'
				? `${e.status}:${e.dayName}`
				: `${e.kind}:${e.dayName}`,
		)

describe('rotation on training weekdays (SCHED-06)', () => {
	it('places the next day on today and the following ones after it', () => {
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines: [ppl()],
			sessions: [],
		})
		// Monday passed without a session: which day it was is unknown.
		expect(entriesOn(week, 14)).toEqual(['NOT_LOGGED:null'])
		expect(entriesOn(week, 15)).toEqual([])
		expect(entriesOn(week, 16)).toEqual(['PLANNED:Pull'])
		expect(entriesOn(week, 18)).toEqual(['PLANNED:Legs'])
		expect(week.rotations).toEqual([])
		expect(week.totals).toMatchObject({ planned: 2, notLogged: 1 })

		const today = week.days.find(day => day.isToday)!
		expect(scheduleEntryAction(today.entries[0], today, false)).toEqual({
			kind: 'START',
			routineId: 'ppl',
			routineDayId: 'pull',
		})

		const next = buildScheduleWeek({
			weekStart: NEXT_WEEK,
			now: NOW,
			routines: [ppl()],
			sessions: [],
		})
		expect(entriesOn(next, 21)).toEqual(['PLANNED:Push'])
		expect(entriesOn(next, 23)).toEqual(['PLANNED:Pull'])
		expect(entriesOn(next, 25)).toEqual(['PLANNED:Legs'])
	})

	it('starts after today once today has a session, in any week', () => {
		// Pull was completed today, so the backend already offers Legs next.
		const routines = [ppl({ nextRotationDayId: 'legs' })]
		const sessions = [done(16, 'Pull')]
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines,
			sessions,
		})
		expect(entriesOn(week, 16)).toEqual(['COMPLETED:Pull'])
		expect(entriesOn(week, 18)).toEqual(['PLANNED:Legs'])
		// Next week knows about today's session even though it is not shown.
		const next = buildScheduleWeek({
			weekStart: NEXT_WEEK,
			now: NOW,
			routines,
			sessions,
		})
		expect(entriesOn(next, 21)).toEqual(['PLANNED:Push'])
	})

	it('continues after the day a live session is training', () => {
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines: [ppl()],
			sessions: [],
			active: {
				id: 'live',
				status: 'IN_PROGRESS',
				startedAt: at(16, 11),
				routineId: 'ppl',
				routineDayId: 'pull',
				routine: { id: 'ppl', name: 'PPL' },
				routineDay: { id: 'pull', dayOfWeek: null, name: 'Pull', order: 1 },
			} as unknown as Parameters<typeof buildScheduleWeek>[0]['active'],
		})
		expect(entriesOn(week, 16)).toEqual(['IN_PROGRESS:Pull'])
		expect(entriesOn(week, 18)).toEqual(['PLANNED:Legs'])
	})

	it('keeps an undated rotation as a note, and names the weekdays', () => {
		const undated = ppl({ rotationWeekdays: [] })
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines: [undated],
			sessions: [],
		})
		expect(week.days.flatMap(day => day.entries)).toEqual([])
		expect(week.rotations.map(note => note.nextDayName)).toEqual(['Pull'])

		expect(describeRoutineSchedule(ppl())).toMatch(
			/^Rotation · .* · Mon, Wed, Fri$/,
		)
		expect(describeRoutineSchedule(undated)).not.toMatch(/Mon/)
		const comparison = compareRoutineSetups(
			routineSetup(ppl()),
			routineSetup(undated),
			'KG',
		)
		expect(comparison.routine[0]).toMatch(/^Schedule: .*Mon, Wed, Fri → /)
	})
})
