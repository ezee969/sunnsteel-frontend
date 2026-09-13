import type { ExerciseEquipment } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import type { Exercise } from '@/lib/api/types'

import {
	describeAlternative,
	findExerciseAlternatives,
} from './exercise-alternatives'

const exercise = (
	id: string,
	fields: Partial<Exercise> & Pick<Exercise, 'movementPattern'>,
): Exercise => ({
	id,
	name: id,
	primaryMuscles: [],
	secondaryMuscles: [],
	equipment: 'barbell',
	mechanic: 'COMPOUND',
	equipmentRequired: [],
	substitutionGroup: null,
	instructions: [],
	mediaUrl: null,
	createdAt: '2026-09-13T00:00:00.000Z',
	updatedAt: '2026-09-13T00:00:00.000Z',
	...fields,
})

const press = (id: string, equipmentRequired: ExerciseEquipment[]) =>
	exercise(id, {
		movementPattern: 'HORIZONTAL_PUSH',
		primaryMuscles: ['PECTORAL'],
		substitutionGroup: 'horizontal-press',
		equipmentRequired,
	})

const bench = press('Bench Press', ['barbell', 'bench', 'rack'])
const catalog: Exercise[] = [
	bench,
	press('Dumbbell Bench Press', ['dumbbell', 'bench']),
	press('Push-ups', ['bodyweight']),
	press('Hammer Chest Press', ['machine']),
	exercise('Close-Grip Bench Press', {
		movementPattern: 'HORIZONTAL_PUSH',
		primaryMuscles: ['TRICEPS'],
		substitutionGroup: 'triceps-press',
		equipmentRequired: ['barbell', 'bench'],
	}),
	exercise('Diamond Push-ups', {
		movementPattern: 'HORIZONTAL_PUSH',
		primaryMuscles: ['TRICEPS', 'PECTORAL'],
		substitutionGroup: 'triceps-press',
		equipmentRequired: ['bodyweight'],
	}),
	exercise('Cable Fly', {
		movementPattern: 'CHEST_FLY',
		primaryMuscles: ['PECTORAL'],
		substitutionGroup: 'chest-fly',
		equipmentRequired: ['cable'],
	}),
	exercise('Custom', { movementPattern: null }),
]

const names = (list: ReturnType<typeof findExerciseAlternatives>) =>
	list.map(alternative => alternative.exercise.name)

describe('findExerciseAlternatives', () => {
	it('ranks near-identical exercises before same-pattern ones sharing a primary muscle', () => {
		const result = findExerciseAlternatives(bench, catalog)
		expect(names(result)).toEqual([
			'Dumbbell Bench Press',
			'Hammer Chest Press',
			'Push-ups',
			'Diamond Push-ups',
		])
		expect(result[0].match).toBe('SUBSTITUTION_GROUP')
		expect(result[3]).toMatchObject({
			match: 'MOVEMENT_PATTERN',
			sharedPrimaryMuscles: ['PECTORAL'],
		})
	})

	it('ranks what the gym lists first and names what is not listed', () => {
		const result = findExerciseAlternatives(bench, catalog, {
			availableEquipment: new Set(['barbell', 'bench', 'dumbbell']),
		})
		expect(names(result)).toEqual([
			'Dumbbell Bench Press',
			'Push-ups',
			'Hammer Chest Press',
			'Diamond Push-ups',
		])
		expect(result[1].unlistedEquipment).toEqual([])
		expect(result[2].unlistedEquipment).toEqual(['machine'])
	})

	it('skips excluded exercises, honours the limit and needs metadata', () => {
		expect(
			names(
				findExerciseAlternatives(bench, catalog, {
					exclude: ['Dumbbell Bench Press'],
					limit: 2,
				}),
			),
		).toEqual(['Hammer Chest Press', 'Push-ups'])
		expect(
			findExerciseAlternatives(
				catalog.find(e => e.id === 'Custom')!,
				catalog,
			),
		).toEqual([])
	})
})

describe('describeAlternative', () => {
	it('explains the match and any equipment the gym does not list', () => {
		const [nearIdentical, , , samePattern] = findExerciseAlternatives(
			bench,
			catalog,
		)
		expect(describeAlternative(nearIdentical)).toBe('Near-identical movement')
		expect(describeAlternative(samePattern)).toBe('Same movement · Pecs')

		const [, , machine] = findExerciseAlternatives(bench, catalog, {
			availableEquipment: new Set(['barbell', 'bench', 'dumbbell']),
		})
		expect(describeAlternative(machine, 'Home Gym')).toBe(
			'Near-identical movement · Machines not listed at Home Gym',
		)
	})
})
