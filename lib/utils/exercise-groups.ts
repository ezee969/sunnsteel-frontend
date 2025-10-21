import type { SetLog, WorkoutSession } from '@/lib/api/types/workout.type'

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

	return session.routineDay.exercises.map((routineExercise) => ({
		routineExerciseId: routineExercise.id,
		exercise: routineExercise.exercise,
		plannedSets: routineExercise.sets,
		performedSets: setLogsByExercise[routineExercise.id] ?? [],
	}))
}
