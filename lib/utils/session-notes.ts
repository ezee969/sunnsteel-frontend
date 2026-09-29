import type { SessionExerciseNote } from '@sunsteel/contracts'

import type { Translator } from '@/i18n/translator'

/**
 * LIVE-16 copy. A note is what the owner wrote about this workout; the
 * routine's own exercise note is the standing instruction and is only ever
 * shown here, never written.
 */

export function exerciseNoteLabel(
	exerciseName: string,
	hasNote: boolean,
	t: Translator<'workout.notes'>,
) {
	return hasNote
		? t('editLabel', { exerciseName })
		: t('addLabel', { exerciseName })
}

export function remainingCharacters(
	value: string,
	max: number,
	t: Translator<'workout.notes'>,
): string {
	const left = max - value.length
	return t('charactersLeft', { count: left })
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
