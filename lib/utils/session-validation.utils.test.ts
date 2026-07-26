import { describe, expect, it } from 'vitest'
import {
	isSetComplete,
	validateSessionFinish,
	validateSetLogPayload,
	validateWeight,
} from './session-validation.utils'
import type { UpsertSetLogPayload } from './workout-session.types'

const valid: UpsertSetLogPayload = {
	routineExerciseId: 're1',
	exerciseId: 'e1',
	setNumber: 1,
	reps: 8,
	weight: 60,
}

describe('validateSetLogPayload', () => {
	it('accepts a well-formed payload', () => {
		expect(validateSetLogPayload(valid)).toEqual({ isValid: true, errors: [] })
	})

	it('accepts 0 reps — a logged set with no reps is not a validation error', () => {
		expect(validateSetLogPayload({ ...valid, reps: 0 }).isValid).toBe(true)
	})

	it('accepts a missing weight (bodyweight exercises)', () => {
		expect(
			validateSetLogPayload({ ...valid, weight: undefined }).isValid,
		).toBe(true)
	})

	it('accepts weight 0 but rejects negative weight', () => {
		expect(validateSetLogPayload({ ...valid, weight: 0 }).isValid).toBe(true)
		expect(validateSetLogPayload({ ...valid, weight: -1 }).isValid).toBe(false)
	})

	it('rejects a set number below 1', () => {
		expect(validateSetLogPayload({ ...valid, setNumber: 0 }).isValid).toBe(false)
	})

	it('reports every problem at once rather than stopping at the first', () => {
		const result = validateSetLogPayload({
			routineExerciseId: '',
			exerciseId: '',
			setNumber: 0,
			reps: -1,
			weight: -1,
		})
		expect(result.isValid).toBe(false)
		expect(result.errors).toHaveLength(5)
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
		expect(validateSessionFinish(10, 10)).toEqual({
			isValid: true,
			canFinish: true,
			warnings: [],
		})
	})

	it('still allows finishing early, but warns', () => {
		const result = validateSessionFinish(3, 10)
		expect(result.canFinish).toBe(true)
		expect(result.warnings).toEqual(['7 out of 10 sets are incomplete'])
	})

	it('treats a session with no sets as finishable', () => {
		expect(validateSessionFinish(0, 0).canFinish).toBe(true)
	})

	it('rejects impossible counts', () => {
		expect(validateSessionFinish(11, 10).isValid).toBe(false)
		expect(validateSessionFinish(-1, 10).isValid).toBe(false)
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
