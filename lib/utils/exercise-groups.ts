import type { LinearPeriodizationState, SetKind } from '@sunsteel/contracts'

import type { SetLog, WorkoutSession } from '@/lib/api/types/workout.type'

import { lpWorkingIndexes, sessionLinearBlock } from './session-linear-block'
import { substitutionFor } from './session-substitutions'

export interface ExerciseGroup {
	routineExerciseId: string
	exercise: {
		id: string
		name: string
		primaryMuscles: string[]
		secondaryMuscles?: string[]
		equipment?: string | null
	}
	plannedSets: {
		id: string
		setNumber: number
		repType: 'FIXED' | 'RANGE'
		reps?: number | null
		minReps?: number | null
		maxReps?: number | null
		weight?: number | null
		kind?: SetKind
		/** ROUT-17: 0-based place among the working sets; null for a warm-up. */
		workingIndex?: number | null
	}[]
	performedSets: SetLog[]
	/** LIVE-15: sets logged beyond the prescription, in order. */
	extraSets: SetLog[]
	/** LIVE-11: the prescribed exercise when this slot was swapped. */
	substitutedFrom?: { id: string; name: string }
	/**
	 * ROUT-17: the 8-week block this slot trained, as it stood when the workout
	 * started; null on any other slot and on a swapped one.
	 */
	linearPeriodization?: LinearPeriodizationState | null
}

function groupSetLogsByExercise(setLogs?: SetLog[]): Record<string, SetLog[]> {
	if (!setLogs?.length) {
		return {}
	}

	return setLogs.reduce<Record<string, SetLog[]>>((acc, log) => {
		if (!acc[log.routineExerciseId]) {
			acc[log.routineExerciseId] = []
		}

		acc[log.routineExerciseId].push(log)
		return acc
	}, {})
}

export function buildExerciseGroups(session?: WorkoutSession): ExerciseGroup[] {
	if (!session?.routineDay?.exercises?.length) {
		return []
	}

	const setLogsByExercise = groupSetLogsByExercise(session.setLogs)

	return session.routineDay.exercises.map(routineExercise => {
		const performedSets = setLogsByExercise[routineExercise.id] ?? []
		const prescribed = routineExercise.sets.reduce(
			(max, set) => Math.max(max, set.setNumber),
			0,
		)
		const substitution = substitutionFor(
			session.exerciseSubstitutions,
			routineExercise.id,
		)
		const workingIndexes = lpWorkingIndexes(routineExercise.sets)
		const plannedSets = routineExercise.sets.map(set => ({
			...set,
			workingIndex: workingIndexes.get(set.setNumber) ?? null,
		}))
		return {
			routineExerciseId: routineExercise.id,
			exercise: substitution
				? { ...substitution.exercise, equipment: null }
				: routineExercise.exercise,
			// The prescribed load belonged to the exercise that was replaced.
			plannedSets: substitution
				? plannedSets.map(set => ({ ...set, weight: null }))
				: plannedSets,
			performedSets,
			extraSets: performedSets
				.filter(set => set.setNumber > prescribed)
				.sort((a, b) => a.setNumber - b.setNumber),
			substitutedFrom: substitution
				? {
						id: routineExercise.exercise.id,
						name: routineExercise.exercise.name,
					}
				: undefined,
			// A swapped slot left its block for that workout.
			linearPeriodization: substitution
				? null
				: sessionLinearBlock(routineExercise).state,
		}
	})
}
