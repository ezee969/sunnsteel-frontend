import type { SetLog, WorkoutSession } from '@/lib/api/types/workout.type'

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
	}[]
	performedSets: SetLog[]
	/** LIVE-11: the prescribed exercise when this slot was swapped. */
	substitutedFrom?: { id: string; name: string }
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
		const substitution = substitutionFor(
			session.exerciseSubstitutions,
			routineExercise.id,
		)
		return {
			routineExerciseId: routineExercise.id,
			exercise: substitution
				? { ...substitution.exercise, equipment: null }
				: routineExercise.exercise,
			// The prescribed load belonged to the exercise that was replaced.
			plannedSets: substitution
				? routineExercise.sets.map(set => ({ ...set, weight: null }))
				: routineExercise.sets,
			performedSets: setLogsByExercise[routineExercise.id] ?? [],
			substitutedFrom: substitution
				? {
						id: routineExercise.exercise.id,
						name: routineExercise.exercise.name,
					}
				: undefined,
		}
	})
}
