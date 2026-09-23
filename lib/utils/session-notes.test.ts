import { describe, expect, it } from 'vitest'

import {
	EXERCISE_NOTE_SCOPE,
	exerciseNoteLabel,
	noteFor,
	remainingCharacters,
	WORKOUT_NOTE_SCOPE,
} from './session-notes'

describe('session notes say whose note they are', () => {
	it('keeps an exercise note to this workout and the routine untouched', () => {
		expect(EXERCISE_NOTE_SCOPE).toContain('Only this workout keeps it')
		expect(EXERCISE_NOTE_SCOPE).toContain('stays as it is')
		expect(WORKOUT_NOTE_SCOPE).toContain('history and recap')
	})

	it('names the exercise and whether a note exists in the control', () => {
		expect(exerciseNoteLabel('Squat', false)).toBe(
			'Add a note on Squat for this workout',
		)
		expect(exerciseNoteLabel('Squat', true)).toBe(
			'Edit your note on Squat for this workout',
		)
	})

	it('counts what is left of the limit', () => {
		expect(remainingCharacters('abc', 500)).toBe('497 characters left')
		expect(remainingCharacters('x'.repeat(499), 500)).toBe('1 character left')
	})

	it('finds a slot note and nothing for an unnoted slot', () => {
		const notes = [{ routineExerciseId: 'a', note: 'Paused reps' }]
		expect(noteFor(notes, 'a')).toBe('Paused reps')
		expect(noteFor(notes, 'b')).toBeNull()
		expect(noteFor(undefined, 'a')).toBeNull()
	})
})
