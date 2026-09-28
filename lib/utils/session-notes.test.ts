import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import { exerciseNoteLabel, noteFor, remainingCharacters } from './session-notes'

const en = translatorFor('en', 'workout.notes')
const es = translatorFor('es', 'workout.notes')

describe('session notes say whose note they are', () => {
	it('keeps an exercise note to this workout and the routine untouched', () => {
		expect(en('exerciseScope')).toContain('Only this workout keeps it')
		expect(en('exerciseScope')).toContain('stays as it is')
		expect(en('workoutScope')).toContain('history and recap')
	})

	it('names the exercise and whether a note exists in the control', () => {
		expect(exerciseNoteLabel('Squat', false, en)).toBe(
			'Add a note on Squat for this workout',
		)
		expect(exerciseNoteLabel('Squat', true, en)).toBe(
			'Edit your note on Squat for this workout',
		)
	})

	it('counts what is left of the limit', () => {
		expect(remainingCharacters('abc', 500, en)).toBe('497 characters left')
		expect(remainingCharacters('x'.repeat(499), 500, en)).toBe(
			'1 character left',
		)
	})

	it('finds a slot note and nothing for an unnoted slot', () => {
		const notes = [{ routineExerciseId: 'a', note: 'Paused reps' }]
		expect(noteFor(notes, 'a')).toBe('Paused reps')
		expect(noteFor(notes, 'b')).toBeNull()
		expect(noteFor(undefined, 'a')).toBeNull()
	})

	it('says the same in Spanish, singular and plural (I18N-04)', () => {
		expect(exerciseNoteLabel('Sentadilla', false, es)).toBe(
			'Agregar una nota en Sentadilla para este entrenamiento',
		)
		expect(remainingCharacters('abc', 500, es)).toBe('Quedan 497 caracteres')
		expect(remainingCharacters('x'.repeat(499), 500, es)).toBe(
			'Queda 1 carácter',
		)
	})
})
