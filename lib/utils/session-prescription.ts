import type { RoutineDay, WorkoutSession } from '@sunsteel/contracts'

/**
 * ROUT-15/LIVE-11: what a session trains is the prescription captured when it
 * started -- the session's own `routineDay`, which the backend serves from the
 * session snapshot -- never the routine as it is now. The live screen used to
 * look the day up in the current routine, which cannot hold a training
 * block's day and would drift from the snapshot after any later change.
 *
 * The snapshot always carries `restSeconds` (the column is non-null with a 60
 * second default), so the fallback only guards an old or partial payload.
 */
export function sessionPrescription(
	session: Pick<WorkoutSession, 'routineDay'> | null | undefined,
): RoutineDay | null {
	const day = session?.routineDay
	if (!day) return null
	return {
		id: day.id,
		dayOfWeek: day.dayOfWeek ?? null,
		name: day.name ?? null,
		order: day.order ?? 0,
		exercises: day.exercises.map(exercise => ({
			id: exercise.id,
			order: exercise.order,
			restSeconds: exercise.restSeconds ?? 60,
			note: exercise.note ?? null,
			progressionScheme: exercise.progressionScheme,
			minWeightIncrement: exercise.minWeightIncrement,
			exercise: {
				id: exercise.exercise.id,
				name: exercise.exercise.name,
				primaryMuscles: exercise.exercise.primaryMuscles,
				secondaryMuscles: exercise.exercise.secondaryMuscles,
			},
			sets: exercise.sets.map(set => ({
				setNumber: set.setNumber,
				repType: set.repType,
				reps: set.reps,
				minReps: set.minReps,
				maxReps: set.maxReps,
				weight: set.weight,
				rir: set.rir,
				kind: set.kind,
			})),
		})),
	}
}

/**
 * "Upper / Lower · Strength" while a session trains a block, and
 * "... · Deload" while it trains a deload (ROUT-16).
 */
export function sessionRoutineTitle(
	session: Pick<WorkoutSession, 'routine' | 'trainingBlock'> &
		Partial<Pick<WorkoutSession, 'temporaryOverride'>>,
): string {
	return [
		session.routine?.name ?? 'Workout',
		session.trainingBlock?.name,
		session.temporaryOverride ? 'Deload' : null,
	]
		.filter(Boolean)
		.join(' · ')
}
