import type { RoutineDay } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import {
	describeRoutineFrequency,
	describeRoutineSchedule,
	nextRotationDay,
	orderedRoutineDays,
	routineDayTitle,
	startableDayToday,
} from './routine-schedule'

const day = (
	id: string,
	order: number,
	dayOfWeek: number | null,
	name: string | null = null,
): RoutineDay => ({ id, order, dayOfWeek, name, exercises: [] })

const weekly = {
	scheduleMode: 'WEEKLY' as const,
	nextRotationDayId: null,
	days: [day('fri', 2, 5), day('mon', 0, 1, 'Push'), day('wed', 1, 3)],
}

const rotation = {
	scheduleMode: 'ROTATION' as const,
	nextRotationDayId: 'pull',
	days: [
		day('legs', 2, null, 'Legs'),
		day('push', 0, null, 'Push'),
		day('pull', 1, null),
	],
}

const perWeek = (days: number) => `${days} days/week`

describe('routine schedule', () => {
	it('orders days as the routine runs them', () => {
		expect(orderedRoutineDays(rotation).map(d => d.id)).toEqual([
			'push',
			'pull',
			'legs',
		])
	})

	it('offers the next rotation day any weekday, and weekly days on their weekday', () => {
		expect(startableDayToday(rotation, 0)?.id).toBe('pull')
		expect(startableDayToday(rotation, 4)?.id).toBe('pull')
		expect(
			startableDayToday({ ...rotation, nextRotationDayId: 'gone' }, 4)?.id,
		).toBe('push')
		expect(nextRotationDay(weekly)).toBeNull()
		expect(startableDayToday(weekly, 3)?.id).toBe('wed')
		expect(startableDayToday(weekly, 4)).toBeNull()
	})

	it('names days by weekday and name, or by rotation name and letter', () => {
		expect(routineDayTitle(day('m', 0, 1, 'Push'))).toBe('Monday · Push')
		expect(routineDayTitle(day('m', 0, 1), 'short')).toBe('Mon')
		expect(routineDayTitle(day('r', 1, null))).toBe('Day B')
		expect(routineDayTitle(day('r', 1, null, ' Pull '))).toBe('Pull')
	})

	it('summarises the schedule and its frequency', () => {
		expect(describeRoutineSchedule(weekly)).toBe('Mon · Wed · Fri')
		expect(describeRoutineSchedule({ ...weekly, restDays: [6, 0] })).toBe(
			'Mon · Wed · Fri · Rest Sat, Sun',
		)
		expect(describeRoutineSchedule(rotation)).toBe(
			'Rotation · Push · Day B · Legs',
		)
		expect(describeRoutineFrequency(weekly, perWeek)).toBe('3 days/week')
		expect(describeRoutineFrequency(rotation, perWeek)).toBe('3-day rotation')
	})
})
