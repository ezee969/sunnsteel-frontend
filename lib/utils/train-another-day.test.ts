import type { Routine } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { trainableDays } from './train-another-day'

const SUNDAY = 0
const MONDAY = 1

function routine(over: Partial<Routine> & { id: string }): Routine {
	return {
		userId: 'u1',
		name: 'Routine',
		isPeriodized: false,
		isFavorite: false,
		isCompleted: false,
		scheduleMode: 'WEEKLY',
		nextRotationDayId: null,
		restDays: [],
		rotationWeekdays: [],
		days: [],
		...over,
	} as unknown as Routine
}

function day(over: {
	id: string
	dayOfWeek?: number | null
	name?: string | null
	order?: number
	exercises?: number
}) {
	return {
		id: over.id,
		dayOfWeek: over.dayOfWeek ?? null,
		name: over.name ?? null,
		order: over.order ?? 0,
		exercises: Array.from({ length: over.exercises ?? 1 }, (_, i) => ({
			id: `${over.id}-e${i}`,
		})),
	}
}

describe('LIVE-06 which days can be trained now', () => {
	it('offers a day that is not planned for today', () => {
		// The whole point of the item: startSession never checked the date, so
		// a Thursday day is trainable on a Monday.
		const days = trainableDays(
			[
				routine({
					id: 'r1',
					name: 'Upper/Lower',
					days: [day({ id: 'd1', dayOfWeek: 4, name: 'Upper' })],
				} as Partial<Routine> & { id: string }),
			],
			MONDAY,
		)
		expect(days).toHaveLength(1)
		expect(days[0]).toMatchObject({
			dayId: 'd1',
			dayLabel: 'Upper',
			routineName: 'Upper/Lower',
			isToday: false,
		})
	})

	it('puts today’s day first without hiding the others', () => {
		const days = trainableDays(
			[
				routine({
					id: 'r1',
					days: [
						day({ id: 'other', dayOfWeek: 4, order: 0 }),
						day({ id: 'today', dayOfWeek: MONDAY, order: 1 }),
					],
				} as Partial<Routine> & { id: string }),
			],
			MONDAY,
		)
		expect(days.map(d => d.dayId)).toEqual(['today', 'other'])
		expect(days.map(d => d.isToday)).toEqual([true, false])
	})

	it('leaves out a day with no exercises', () => {
		// This is the bug FIX-04 hid: Quick Workout opened a session against a
		// day with `exercises: []`, which had nothing to log and no way to add
		// anything. Offering one here would reintroduce it.
		const days = trainableDays(
			[
				routine({
					id: 'r1',
					days: [
						day({ id: 'empty', exercises: 0 }),
						day({ id: 'real', exercises: 3 }),
					],
				} as Partial<Routine> & { id: string }),
			],
			MONDAY,
		)
		expect(days.map(d => d.dayId)).toEqual(['real'])
		expect(days[0].exerciseCount).toBe(3)
	})

	it('leaves out a completed routine', () => {
		// The server's routinesPlannedOn skips one when deciding what a day
		// plans; a list that offered it would disagree with the schedule.
		const days = trainableDays(
			[
				routine({
					id: 'done',
					isCompleted: true,
					days: [day({ id: 'd1' })],
				} as Partial<Routine> & { id: string }),
			],
			MONDAY,
		)
		expect(days).toEqual([])
	})

	it('keeps each routine’s own day order', () => {
		const days = trainableDays(
			[
				routine({
					id: 'r1',
					days: [
						day({ id: 'third', order: 2 }),
						day({ id: 'first', order: 0 }),
						day({ id: 'second', order: 1 }),
					],
				} as Partial<Routine> & { id: string }),
			],
			MONDAY,
		)
		expect(days.map(d => d.dayId)).toEqual(['first', 'second', 'third'])
	})

	it('names a rotation day by its letter and never calls it today', () => {
		// A rotation day carries no weekday, so the calendar cannot make it
		// today; the schedule decides that, not this list.
		const days = trainableDays(
			[
				routine({
					id: 'r1',
					scheduleMode: 'ROTATION',
					days: [day({ id: 'd1', dayOfWeek: null, order: 0 })],
				} as Partial<Routine> & { id: string }),
			],
			SUNDAY,
		)
		expect(days[0].dayLabel).toBe('Day A')
		expect(days[0].isToday).toBe(false)
	})

	it('answers empty rather than throwing when there is nothing to offer', () => {
		expect(trainableDays(undefined, MONDAY)).toEqual([])
		expect(trainableDays([], MONDAY)).toEqual([])
		expect(
			trainableDays(
				[routine({ id: 'r1', days: [] } as Partial<Routine> & { id: string })],
				MONDAY,
			),
		).toEqual([])
	})
})
