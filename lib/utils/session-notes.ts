import type { SessionExerciseNote } from '@sunsteel/contracts'

/**
 * LIVE-16 copy. A note is what the owner wrote about this workout; the
 * routine's own exercise note is the standing instruction and is only ever
 * shown here, never written.
 */

export const EXERCISE_NOTE_SCOPE =
	'Only this workout keeps it. Your routine’s note for this exercise stays as it is.'

export const WORKOUT_NOTE_SCOPE =
	'Context for this workout — sleep, energy, anything that explains the numbers. It shows in its history and recap.'

export function exerciseNoteLabel(exerciseName: string, hasNote: boolean) {
	return hasNote
		? `Edit your note on ${exerciseName} for this workout`
		: `Add a note on ${exerciseName} for this workout`
}

export function remainingCharacters(value: string, max: number): string {
	const left = max - value.length
	return left === 1
		? '1 character left'
		: `${left.toLocaleString()} characters left`
}

export function noteFor(
	notes: SessionExerciseNote[] | undefined,
	routineExerciseId: string,
): string | null {
	return (
		notes?.find(item => item.routineExerciseId === routineExerciseId)?.note ??
		null
	)
}
