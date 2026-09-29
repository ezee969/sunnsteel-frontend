import type { Routine, RoutineExercise, RoutineSet } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { describeSetScheme, findRoutineUsages } from './exercise-detail'

const enDate = translatorFor('en', 'routines.date')
const enFormat = translatorFor('en', 'routines.format')
const esDate = translatorFor('es', 'routines.date')
const esFormat = translatorFor('es', 'routines.format')

const fixed = (reps: number): RoutineSet =>
	({ setNumber: 1, repType: 'FIXED', reps }) as RoutineSet
const range = (minReps: number, maxReps: number): RoutineSet =>
	({ setNumber: 1, repType: 'RANGE', minReps, maxReps }) as RoutineSet

const slot = (
	id: string,
	exerciseId: string,
	order: number,
	sets: RoutineSet[],
): RoutineExercise =>
	({
		id,
		order,
		restSeconds: 90,
		progressionScheme: 'NONE',
		minWeightIncrement: 2.5,
		exercise: { id: exerciseId, name: exerciseId },
		sets,
	}) as RoutineExercise

const routine = (id: string, name: string, days: Routine['days']): Routine =>
	({
		id,
		userId: 'user-1',
		name,
		isPeriodized: false,
		isFavorite: false,
		isCompleted: false,
		days,
		createdAt: '2026-09-01T00:00:00.000Z',
		updatedAt: '2026-09-01T00:00:00.000Z',
	}) as Routine

describe('formatSetScheme', () => {
	it('collapses matching targets and lists differing ones', () => {
		expect(
			describeSetScheme([range(8, 12), range(8, 12), range(8, 12)], enFormat),
		).toBe('3 × 8–12')
		expect(describeSetScheme([fixed(10), fixed(8), fixed(6)], enFormat)).toBe(
			'3 sets · 10, 8, 6 reps',
		)
		expect(describeSetScheme([fixed(5)], enFormat)).toBe('1 × 5')
	})

	it('falls back to the count when a target is missing', () => {
		expect(
			describeSetScheme(
				[range(8, 12), { ...range(8, 12), maxReps: null }],
				enFormat,
			),
		).toBe('2 sets')
		expect(describeSetScheme([], enFormat)).toBe('No sets')
	})
})

describe('findRoutineUsages', () => {
	it('lists every day that programs the exercise, routines by name', () => {
		const usages = findRoutineUsages(
			[
				routine('b', 'Upper / Lower', [
					{
						id: 'thu',
						dayOfWeek: 4,
						name: null,
						order: 1,
						exercises: [slot('s3', 'bench', 0, [fixed(5), fixed(5)])],
					},
					{
						id: 'mon',
						dayOfWeek: 1,
						name: null,
						order: 0,
						exercises: [
							slot('s1', 'row', 0, [fixed(8)]),
							slot('s2', 'bench', 1, [range(6, 8), range(6, 8)]),
						],
					},
				]),
				routine('a', 'Arms', [
					{
						id: 'fri',
						dayOfWeek: 5,
						name: null,
						order: 0,
						exercises: [slot('s4', 'curl', 0, [fixed(12)])],
					},
				]),
				routine('c', 'Accessory', [
					{
						id: 'sat',
						dayOfWeek: 6,
						name: null,
						order: 0,
						exercises: [slot('s5', 'bench', 0, [fixed(10)])],
					},
				]),
			],
			'bench',
			enDate,
			enFormat,
		)
		expect(usages).toEqual([
			{
				routineId: 'c',
				routineName: 'Accessory',
				days: [{ dayId: 'sat', dayName: 'Saturday', schemes: ['1 × 10'] }],
			},
			{
				routineId: 'b',
				routineName: 'Upper / Lower',
				days: [
					{ dayId: 'mon', dayName: 'Monday', schemes: ['2 × 6–8'] },
					{ dayId: 'thu', dayName: 'Thursday', schemes: ['2 × 5'] },
				],
			},
		])
	})

	it('names each day in the reader’s language', () => {
		expect(
			findRoutineUsages(
				[
					routine('b', 'Upper / Lower', [
						{
							id: 'thu',
							dayOfWeek: 4,
							name: null,
							order: 0,
							exercises: [slot('s1', 'bench', 0, [fixed(5)])],
						},
					]),
				],
				'bench',
				esDate,
				esFormat,
			)[0]?.days[0]?.dayName,
		).toBe('Jueves')
	})

	it('returns nothing when no routine uses the exercise', () => {
		expect(findRoutineUsages([], 'bench', enDate, enFormat)).toEqual([])
	})
})

describe('the set scheme in Spanish (I18N-04)', () => {
	it('agrees the set count with its noun', () => {
		expect(describeSetScheme([], esFormat)).toBe('Sin series')
		expect(describeSetScheme([fixed(5)], esFormat)).toBe('1 × 5')
		expect(describeSetScheme([fixed(10), fixed(8), fixed(6)], esFormat)).toBe(
			'3 series · 10, 8, 6 reps',
		)
	})
})
