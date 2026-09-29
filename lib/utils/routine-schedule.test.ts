import type { RoutineDay } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	describeRoutineFrequency,
	describeRoutineSchedule,
	nextRotationDay,
	orderedRoutineDays,
	routineDayTitle,
	startableDayToday,
} from './routine-schedule'

const enDate = translatorFor('en', 'routines.date')
const enSchedule = translatorFor('en', 'routines.schedule')
const esDate = translatorFor('es', 'routines.date')
const esSchedule = translatorFor('es', 'routines.schedule')

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
		expect(routineDayTitle(day('m', 0, 1, 'Push'), 'long', enDate)).toBe(
			'Monday · Push',
		)
		expect(routineDayTitle(day('m', 0, 1), 'short', enDate)).toBe('Mon')
		expect(routineDayTitle(day('r', 1, null), 'long', enDate)).toBe('Day B')
		expect(routineDayTitle(day('r', 1, null, ' Pull '), 'long', enDate)).toBe(
			'Pull',
		)
	})

	it('says the same in Spanish (I18N-03)', () => {
		expect(routineDayTitle(day('m', 0, 1, 'Push'), 'long', esDate)).toBe(
			'Lunes · Push',
		)
		expect(routineDayTitle(day('m', 0, 1), 'short', esDate)).toBe('Lun')
	})

	it('summarises the schedule and its frequency', () => {
		expect(describeRoutineSchedule(weekly, enDate, enSchedule)).toBe(
			'Mon · Wed · Fri',
		)
		expect(
			describeRoutineSchedule(
				{ ...weekly, restDays: [6, 0] },
				enDate,
				enSchedule,
			),
		).toBe('Mon · Wed · Fri · Rest Sat, Sun')
		expect(describeRoutineSchedule(rotation, enDate, enSchedule)).toBe(
			'Rotation · Push · Day B · Legs',
		)
		expect(describeRoutineFrequency(weekly, perWeek, enSchedule)).toBe(
			'3 days/week',
		)
		expect(describeRoutineFrequency(rotation, perWeek, enSchedule)).toBe(
			'3-day rotation',
		)
	})

	it('summarises the schedule and its frequency in Spanish (I18N-03)', () => {
		expect(
			describeRoutineSchedule(
				{ ...weekly, restDays: [6, 0] },
				esDate,
				esSchedule,
			),
		).toBe('Lun · Mié · Vie · Descanso Sáb, Dom')
		expect(describeRoutineSchedule(rotation, esDate, esSchedule)).toBe(
			'Rotación · Push · Day B · Legs',
		)
		expect(describeRoutineFrequency(rotation, perWeek, esSchedule)).toBe(
			'Rotación de 3 días',
		)
	})
})
