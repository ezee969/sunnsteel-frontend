import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'

import {
	isSetComplete,
	validateSessionFinish,
	validateSetLogPayload,
	validateWeight,
} from './session-validation.utils'
import type { UpsertSetLogPayload } from './workout-session.types'

const en = translatorFor('en', 'core.setLogValidation')
const es = translatorFor('es', 'core.setLogValidation')

const valid: UpsertSetLogPayload = {
	routineExerciseId: 're1',
	exerciseId: 'e1',
	setNumber: 1,
	reps: 8,
	weight: 60,
}

describe('validateSetLogPayload', () => {
	it('accepts a well-formed payload', () => {
		expect(validateSetLogPayload(valid, en)).toEqual({
			isValid: true,
			errors: [],
		})
	})

	it('accepts 0 reps — a logged set with no reps is not a validation error', () => {
		expect(validateSetLogPayload({ ...valid, reps: 0 }, en).isValid).toBe(true)
	})

	it('accepts a missing weight (bodyweight exercises)', () => {
		expect(
			validateSetLogPayload({ ...valid, weight: undefined }, en).isValid,
		).toBe(true)
	})

	it('accepts weight 0 but rejects negative weight', () => {
		expect(validateSetLogPayload({ ...valid, weight: 0 }, en).isValid).toBe(
			true,
		)
		expect(validateSetLogPayload({ ...valid, weight: -1 }, en).isValid).toBe(
			false,
		)
	})

	it('accepts a missing RPE — it is optional and was never enterable before', () => {
		expect(
			validateSetLogPayload({ ...valid, rpe: undefined }, en).isValid,
		).toBe(true)
	})

	it('accepts the ends of the 0-10 scale the history view renders against', () => {
		expect(validateSetLogPayload({ ...valid, rpe: 0 }, en).isValid).toBe(true)
		expect(validateSetLogPayload({ ...valid, rpe: 7.5 }, en).isValid).toBe(true)
		expect(validateSetLogPayload({ ...valid, rpe: 10 }, en).isValid).toBe(true)
	})

	it('rejects an RPE outside 0-10, which would render as a bogus n/10', () => {
		expect(validateSetLogPayload({ ...valid, rpe: -1 }, en).isValid).toBe(false)
		expect(validateSetLogPayload({ ...valid, rpe: 11 }, en).isValid).toBe(false)
		expect(validateSetLogPayload({ ...valid, rpe: NaN }, en).isValid).toBe(
			false,
		)
	})

	it('rejects a set number below 1', () => {
		expect(validateSetLogPayload({ ...valid, setNumber: 0 }, en).isValid).toBe(
			false,
		)
	})

	it('reports every problem at once rather than stopping at the first, tagging the field', () => {
		const result = validateSetLogPayload(
			{
				routineExerciseId: '',
				exerciseId: '',
				setNumber: 0,
				reps: -1,
				weight: -1,
			},
			en,
		)
		expect(result.isValid).toBe(false)
		expect(result.errors).toHaveLength(5)
		expect(result.errors.map(error => error.field)).toEqual([
			'routineExerciseId',
			'exerciseId',
			'setNumber',
			'reps',
			'weight',
		])
	})

	it('says the same in Spanish (I18N-03)', () => {
		const result = validateSetLogPayload({ ...valid, weight: -1 }, es)
		expect(result.errors).toEqual([
			{ field: 'weight', message: 'El peso debe ser 0 o más' },
		])
	})
})

describe('isSetComplete', () => {
	it('respects an explicit flag over the reps heuristic', () => {
		expect(isSetComplete(0, true)).toBe(true)
		expect(isSetComplete(10, false)).toBe(false)
	})

	it('falls back to reps > 0 when no flag is given', () => {
		expect(isSetComplete(1)).toBe(true)
		expect(isSetComplete(0)).toBe(false)
	})
})

describe('validateSessionFinish', () => {
	it('allows finishing with everything done and warns about nothing', () => {
		expect(validateSessionFinish(10, 10, en)).toEqual({
			isValid: true,
			canFinish: true,
			warnings: [],
		})
	})

	it('still allows finishing early, but warns', () => {
		const result = validateSessionFinish(3, 10, en)
		expect(result.canFinish).toBe(true)
		expect(result.warnings).toEqual(['7 out of 10 sets are incomplete'])
	})

	it('treats a session with no sets as finishable', () => {
		expect(validateSessionFinish(0, 0, en).canFinish).toBe(true)
	})

	it('rejects impossible counts', () => {
		expect(validateSessionFinish(11, 10, en).isValid).toBe(false)
		expect(validateSessionFinish(-1, 10, en).isValid).toBe(false)
	})

	it('says the same in Spanish (I18N-03)', () => {
		const result = validateSessionFinish(3, 10, es)
		expect(result.warnings).toEqual(['7 de 10 series están sin completar'])
	})
})

describe('validateWeight', () => {
	it('treats null and undefined as valid (weight is optional)', () => {
		expect(validateWeight(undefined)).toBe(true)
		expect(validateWeight(null)).toBe(true)
	})

	it('rejects NaN and Infinity', () => {
		expect(validateWeight(NaN)).toBe(false)
		expect(validateWeight(Infinity)).toBe(false)
	})

	it('honours allowZero', () => {
		expect(validateWeight(0)).toBe(true)
		expect(validateWeight(0, false)).toBe(false)
	})
})
