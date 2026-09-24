import type {
	Routine,
	RoutineDay,
	RoutineTemporaryOverridePlan,
	RoutineTrainingBlockPlan,
	ScheduleOverride,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { landingDay, routineOn, startableDayToday } from './routine-schedule'
import {
	buildScheduleWeek,
	localDateKey,
	scheduleEntryAction,
	startOfWeek,
} from './schedule-week'
import { sessionRoutineTitle } from './session-prescription'

// Wednesday 16 Sep 2026, local time.
const NOW = new Date(2026, 8, 16, 12, 0)
const THIS_WEEK = startOfWeek(NOW)
const NEXT_WEEK = new Date(2026, 8, 21)
const key = (day: number) => localDateKey(new Date(2026, 8, day))

const day = (
	id: string,
	dayOfWeek: number | null,
	name: string,
	order = 0,
): RoutineDay => ({ id, dayOfWeek, name, order, exercises: [] })

const deload = (
	overrides: Partial<RoutineTemporaryOverridePlan> = {},
): RoutineTemporaryOverridePlan => ({
	id: 'deload-1',
	kind: 'DELOAD',
	startDate: key(17),
	endDate: key(23),
	scheduleMode: 'WEEKLY',
	restDays: [2],
	rotationWeekdays: [],
	nextRotationDayId: null,
	days: [day('d-mon', 1, 'Upper'), day('d-thu', 4, 'Lower', 1)],
	...overrides,
})

const routine = (overrides: Partial<Routine> = {}): Routine => ({
	id: 'split',
	userId: 'u',
	name: 'Split',
	description: null,
	isPeriodized: false,
	visibility: 'PRIVATE',
	isFavorite: false,
	isCompleted: false,
	scheduleMode: 'WEEKLY',
	nextRotationDayId: null,
	restDays: [2],
	rotationWeekdays: [],
	createdAt: new Date(2026, 8, 1).toISOString(),
	updatedAt: new Date(2026, 8, 1).toISOString(),
	days: [day('base-mon', 1, 'Upper'), day('base-thu', 4, 'Lower', 1)],
	trainingBlocks: [],
	temporaryOverrides: [deload()],
	...overrides,
})

const entriesOn = (week: ReturnType<typeof buildScheduleWeek>, date: number) =>
	week.days
		.find(d => d.date === key(date))!
		.entries.map(e =>
			[e.kind, e.dayName, e.trainingBlockName, e.deload ? 'deload' : null]
				.filter(Boolean)
				.join(':'),
		)

describe('deloads in the schedule (ROUT-16)', () => {
	it('plans the deload days on its dates and the routine around them', () => {
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines: [routine()],
			sessions: [],
		})
		expect(entriesOn(week, 14)).toEqual(['NOT_LOGGED:Upper'])
		expect(entriesOn(week, 17)).toEqual(['PLANNED:Lower:deload'])
		const next = buildScheduleWeek({
			weekStart: NEXT_WEEK,
			now: NOW,
			routines: [routine()],
			sessions: [],
		})
		expect(entriesOn(next, 21)).toEqual(['PLANNED:Upper:deload'])
		// The deload ended on the 23rd, so Thursday is the routine's again.
		expect(entriesOn(next, 24)).toEqual(['PLANNED:Lower'])
	})

	it('starts the deload day, with its own id, on a deload date', () => {
		const thursday = new Date(2026, 8, 17, 9, 0)
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: thursday,
			routines: [routine()],
			sessions: [],
		})
		const today = week.days.find(d => d.date === key(17))!
		expect(scheduleEntryAction(today.entries[0], today, false)).toEqual({
			kind: 'START',
			routineId: 'split',
			routineDayId: 'd-thu',
		})
	})

	it('names both the block and the deload that lightens it', () => {
		const block: RoutineTrainingBlockPlan = {
			id: 'rev-1',
			seriesId: 'series-1',
			revision: 1,
			name: 'Strength',
			startDate: key(14),
			endDate: key(30),
			scheduleMode: 'WEEKLY',
			restDays: [],
			rotationWeekdays: [],
			nextRotationDayId: null,
			days: [day('b-thu', 4, 'Heavy')],
		}
		const lightened = routine({
			trainingBlocks: [block],
			temporaryOverrides: [deload({ days: [day('d-thu', 4, 'Heavy')] })],
		})
		const plan = routineOn(lightened, key(17))
		expect(plan.trainingBlock?.name).toBe('Strength')
		expect(plan.temporaryOverride?.id).toBe('deload-1')
		expect(startableDayToday(plan, 4)?.id).toBe('d-thu')
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines: [lightened],
			sessions: [],
		})
		expect(entriesOn(week, 17)).toEqual(['PLANNED:Heavy:Strength:deload'])
	})

	it('continues the rotation through a deload rather than restarting it', () => {
		const ppl = routine({
			scheduleMode: 'ROTATION',
			restDays: [],
			rotationWeekdays: [1, 3, 5],
			nextRotationDayId: 'pull',
			days: [
				day('push', null, 'Push', 0),
				day('pull', null, 'Pull', 1),
				day('legs', null, 'Legs', 2),
			],
			temporaryOverrides: [
				deload({
					startDate: key(23),
					endDate: key(25),
					scheduleMode: 'ROTATION',
					restDays: [],
					rotationWeekdays: [1, 3, 5],
					nextRotationDayId: 'd-pull',
					days: [
						day('d-push', null, 'Push', 0),
						day('d-pull', null, 'Pull', 1),
						day('d-legs', null, 'Legs', 2),
					],
				}),
			],
		})
		const week = buildScheduleWeek({
			weekStart: NEXT_WEEK,
			now: NOW,
			routines: [ppl],
			sessions: [],
		})
		// Wed 16 Pull, Fri 18 Legs, then Push, Pull, Legs in order.
		expect(entriesOn(week, 21)).toEqual(['PLANNED:Push'])
		expect(entriesOn(week, 23)).toEqual(['PLANNED:Pull:deload'])
		expect(entriesOn(week, 25)).toEqual(['PLANNED:Legs:deload'])
	})

	it('trains a workout moved into a deload as that deload’s day', () => {
		// Mon 14 is before the deload; the workout lands on Tue 22, inside it.
		const move: ScheduleOverride = {
			id: 'move-1',
			routineId: 'split',
			kind: 'MOVE',
			date: key(14),
			toDate: key(22),
			createdAt: NOW.toISOString(),
		}
		const week = buildScheduleWeek({
			weekStart: NEXT_WEEK,
			now: NOW,
			routines: [routine()],
			sessions: [],
			overrides: [move],
		})
		const moved = week.days
			.find(d => d.date === key(22))!
			.entries.find(e => e.kind === 'PLANNED')
		expect(moved).toMatchObject({ routineDayId: 'd-mon', deload: true })
	})

	it('keeps the planned day when a move crosses two different plans', () => {
		const base = routine()
		const planned = routineOn(base, key(14))
		const landing = routineOn(
			{ ...base, temporaryOverrides: [], trainingBlocks: [] },
			key(22),
		)
		expect(landingDay(planned, landing, planned.days[0]).day.id).toBe(
			'base-mon',
		)
		const inDeload = routineOn(base, key(22))
		expect(landingDay(planned, inDeload, planned.days[0]).day.id).toBe('d-mon')
		expect(landingDay(inDeload, planned, inDeload.days[0]).day.id).toBe(
			'base-mon',
		)
	})

	it('titles a deload workout so its lighter loads are expected', () => {
		expect(
			sessionRoutineTitle({
				routine: { id: 'split', name: 'Split' },
				trainingBlock: null,
				temporaryOverride: { id: 'deload-1', kind: 'DELOAD' },
			} as never),
		).toBe('Split · Deload')
	})
})
