import type {
	PreviousSetPerformance,
	SessionExerciseSubstitution,
} from '@sunsteel/contracts'

import type { RoutineExercise } from '@/lib/api/types/routine.type'

/**
 * LIVE-11 display rules. The routine keeps the prescription; a session's
 * `exerciseSubstitutions` say which slots were done with another exercise.
 */

export function substitutionFor(
	substitutions: SessionExerciseSubstitution[] | undefined,
	routineExerciseId: string,
): SessionExerciseSubstitution | undefined {
	return substitutions?.find(
		substitution => substitution.routineExerciseId === routineExerciseId,
	)
}

/**
 * Routine exercises as performed in the session: a swapped slot shows the
 * substitute and keeps its rep targets, but drops the prescribed load, which
 * was set for the other exercise, and leaves any 8-week block (ROUT-17).
 */
export function applySessionSubstitutions(
	exercises: RoutineExercise[],
	substitutions: SessionExerciseSubstitution[] | undefined,
): RoutineExercise[] {
	if (!substitutions?.length) return exercises
	return exercises.map(exercise => {
		const substitution = substitutionFor(substitutions, exercise.id)
		if (!substitution) return exercise
		return {
			...exercise,
			exercise: {
				id: substitution.exercise.id,
				name: substitution.exercise.name,
				primaryMuscles: substitution.exercise.primaryMuscles,
				secondaryMuscles: substitution.exercise.secondaryMuscles,
			},
			sets: exercise.sets.map(set => ({ ...set, weight: undefined })),
			// ROUT-17: a swapped slot leaves its 8-week block for this workout --
			// its load is free and the block does not move -- so it is trained
			// like an exercise with no scheme.
			...(exercise.progressionScheme === 'LINEAR_PERIODIZATION'
				? { progressionScheme: 'NONE' as const, linearPeriodization: null }
				: {}),
		}
	})
}

/** "Last time" is a fair comparison only when it was the same exercise. */
export function comparablePrevious(
	previous: PreviousSetPerformance | undefined,
	exerciseId: string,
): PreviousSetPerformance | undefined {
	return previous?.exerciseId === exerciseId ? previous : undefined
}
