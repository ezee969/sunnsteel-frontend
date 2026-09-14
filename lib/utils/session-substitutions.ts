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
 * was set for the other exercise.
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
