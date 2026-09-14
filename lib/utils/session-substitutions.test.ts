import type { SessionExerciseSubstitution } from '@sunsteel/contracts'
import { describe, expect, it } from 'vitest'

import type { RoutineExercise } from '@/lib/api/types/routine.type'
import type { WorkoutSession } from '@/lib/api/types/workout.type'

import { buildExerciseGroups } from './exercise-groups'
import {
	applySessionSubstitutions,
	comparablePrevious,
	substitutionFor,
} from './session-substitutions'

const exercises = [
	{
		id: 'slot-bench',
		order: 0,
		restSeconds: 120,
		progressionScheme: 'DOUBLE_PROGRESSION',
		minWeightIncrement: 2.5,
		exercise: {
			id: 'bench',
			name: 'Bench Press',
			primaryMuscles: ['PECTORAL'],
		},
		sets: [
			{ id: 'set-1', setNumber: 1, repType: 'FIXED', reps: 8, weight: 80 },
		],
	},
	{
		id: 'slot-row',
		order: 1,
		restSeconds: 90,
		progressionScheme: 'NONE',
		minWeightIncrement: 2.5,
		exercise: {
			id: 'row',
			name: 'Cable Row',
			primaryMuscles: ['LATISSIMUS_DORSI'],
		},
		sets: [
			{ id: 'set-2', setNumber: 1, repType: 'FIXED', reps: 10, weight: 50 },
		],
	},
] as unknown as RoutineExercise[]

const pushups: SessionExerciseSubstitution = {
	routineExerciseId: 'slot-bench',
	exercise: {
		id: 'pushups',
		name: 'Push-ups',
		primaryMuscles: ['PECTORAL'],
		secondaryMuscles: ['TRICEPS'],
	},
	substitutedAt: '2026-09-14T08:05:00.000Z',
}

describe('applySessionSubstitutions', () => {
	it('shows the substitute for a swapped slot and drops the prescribed load', () => {
		const [bench, row] = applySessionSubstitutions(exercises, [pushups])
		expect(bench.exercise).toMatchObject({ id: 'pushups', name: 'Push-ups' })
		expect(bench.sets[0]).toMatchObject({ reps: 8, weight: undefined })
		expect(row).toBe(exercises[1])
	})

	it('returns the routine unchanged when nothing was swapped', () => {
		expect(applySessionSubstitutions(exercises, undefined)).toBe(exercises)
		expect(substitutionFor([pushups], 'slot-row')).toBeUndefined()
	})
})

describe('comparablePrevious', () => {
	const previous = {
		routineExerciseId: 'slot-bench',
		exerciseId: 'bench',
		setNumber: 1,
		reps: 8,
		weight: 80,
	}

	it('keeps last time only for the same exercise', () => {
		expect(comparablePrevious(previous, 'bench')).toBe(previous)
		expect(comparablePrevious(previous, 'pushups')).toBeUndefined()
		expect(comparablePrevious(undefined, 'bench')).toBeUndefined()
	})
})

describe('buildExerciseGroups with a swap', () => {
	it('names the performed exercise and remembers the prescribed one', () => {
		const session = {
			id: 'session-1',
			routineDay: { id: 'day-1', exercises },
			setLogs: [],
			exerciseSubstitutions: [pushups],
		} as unknown as WorkoutSession
		const [bench, row] = buildExerciseGroups(session)
		expect(bench.exercise.name).toBe('Push-ups')
		expect(bench.substitutedFrom).toEqual({ id: 'bench', name: 'Bench Press' })
		expect(bench.plannedSets[0].weight).toBeNull()
		expect(row.substitutedFrom).toBeUndefined()
		expect(row.plannedSets[0].weight).toBe(50)
	})
})
