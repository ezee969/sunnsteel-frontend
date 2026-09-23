import type {
	Routine,
	RoutineDay,
	RoutineTrainingBlockPlan,
} from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { routineOn, startableDayToday } from './routine-schedule'
import {
	buildScheduleWeek,
	localDateKey,
	moveTargets,
	scheduleEntryAction,
	startOfWeek,
} from './schedule-week'

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

const block = (
	overrides: Partial<RoutineTrainingBlockPlan> = {},
): RoutineTrainingBlockPlan => ({
	id: 'rev-1',
	seriesId: 'series-1',
	revision: 1,
	name: 'Strength',
	startDate: key(17),
	endDate: key(24),
	scheduleMode: 'WEEKLY',
	restDays: [6],
	rotationWeekdays: [],
	nextRotationDayId: null,
	days: [day('block-thu', 4, 'Heavy'), day('block-sun', 0, 'Volume', 1)],
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
	trainingBlocks: [block()],
	...overrides,
})

const entriesOn = (week: ReturnType<typeof buildScheduleWeek>, date: number) =>
	week.days
		.find(d => d.date === key(date))!
		.entries.map(e =>
			[e.kind, e.dayName, e.trainingBlockName].filter(Boolean).join(':'),
		)

describe('training blocks in the schedule (ROUT-15)', () => {
	it('plans each date by the plan in force on it, across the block start', () => {
		const week = buildScheduleWeek({
			weekStart: THIS_WEEK,
			now: NOW,
			routines: [routine()],
			sessions: [],
		})
		// Before the block (Mon 14 to Wed 16) the baseline applies.
		expect(entriesOn(week, 14)).toEqual(['NOT_LOGGED:Upper'])
		expect(entriesOn(week, 15)).toEqual(['REST'])
		// From Thursday 17 the block's own days and rest apply.
		expect(entriesOn(week, 17)).toEqual(['PLANNED:Heavy:Strength'])
		expect(entriesOn(week, 19)).toEqual(['REST'])
		expect(entriesOn(week, 20)).toEqual(['PLANNED:Volume:Strength'])
	})

	it('offers the block day, with its working-copy id, to start', () => {
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
			routineDayId: 'block-thu',
		})
	})

	it('returns to the baseline the day after the block ends', () => {
		const week = buildScheduleWeek({
			weekStart: new Date(2026, 8, 28),
			now: NOW,
			routines: [routine()],
			sessions: [],
		})
		expect(entriesOn(week, 28)).toEqual(['PLANNED:Upper'])
		expect(entriesOn(week, 29)).toEqual(['REST'])
	})

	it('starts a rotation block on its first day and resumes the baseline after it', () => {
		const rotationBlock = block({
			startDate: key(21),
			endDate: key(23),
			scheduleMode: 'ROTATION',
			restDays: [],
			rotationWeekdays: [1, 2, 3],
			nextRotationDayId: 'b-a',
			days: [day('b-a', null, 'Block A', 0), day('b-b', null, 'Block B', 1)],
		})
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
			trainingBlocks: [rotationBlock],
		})
		const week = buildScheduleWeek({
			weekStart: NEXT_WEEK,
			now: NOW,
			routines: [ppl],
			sessions: [],
		})
		expect(entriesOn(week, 21)).toEqual(['PLANNED:Block A:Strength'])
		expect(entriesOn(week, 22)).toEqual(['PLANNED:Block B:Strength'])
		expect(entriesOn(week, 23)).toEqual(['PLANNED:Block A:Strength'])
		// Friday is back on the baseline, which resumes at its own next day.
		expect(entriesOn(week, 25)).toEqual(['PLANNED:Pull'])
	})

	it('judges move targets by the plan in force on each date', () => {
		const targets = moveTargets({
			occurrenceDate: key(17),
			now: NOW,
			routine: routine(),
			overrides: [],
		})
		// Monday 21 trains in the baseline but not in the block, so it is free.
		expect(targets).toContain(key(21))
		// Sunday 20 is one of the block's own days, so it is taken.
		expect(targets).not.toContain(key(20))
	})

	it('resolves the routine for a date through the one resolver', () => {
		const inBlock = routineOn(routine(), key(18))
		expect(inBlock.trainingBlock?.name).toBe('Strength')
		expect(startableDayToday(inBlock, 4)?.id).toBe('block-thu')
		const baseline = routineOn(routine(), key(16))
		expect(baseline.trainingBlock).toBeNull()
		expect(startableDayToday(baseline, 4)?.id).toBe('base-thu')
	})
})
