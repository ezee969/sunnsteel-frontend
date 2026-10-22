import { describe, expect, it } from 'vitest'

import { parseOptionalPositiveFloat } from '@/features/routines/wizard/utils/validation.helpers'

import { normalizeDecimalInput, sanitizeDecimalInput } from './decimal-input'
import { heightFromDraft, parseLengthInput } from './length-unit'
import { parseWeightInput } from './weight-unit'

describe('decimal input', () => {
	it('reads a comma as the decimal mark, as a comma-region keypad types it', () => {
		expect(normalizeDecimalInput(' 2,5 ')).toBe('2.5')
		expect(sanitizeDecimalInput('2,5')).toBe('2.5')
		expect(sanitizeDecimalInput('102,5kg')).toBe('102.5')
	})

	it('keeps one decimal point whichever mark was typed', () => {
		expect(sanitizeDecimalInput('2.5.')).toBe('2.5')
		expect(sanitizeDecimalInput('2,5,')).toBe('2.5')
		expect(sanitizeDecimalInput('2.5,0')).toBe('2.50')
	})

	it('never reads "2,5" as 2', () => {
		expect(parseWeightInput('2,5', 'KG')).toBe(2.5)
		expect(parseOptionalPositiveFloat('2,5')).toBe(2.5)
		expect(parseLengthInput('180,5', 'CM')).toBe(180.5)
		expect(
			heightFromDraft({ cm: '180,5', feet: '', inches: '' }, 'CM', null),
		).toBe(180.5)
	})
})
