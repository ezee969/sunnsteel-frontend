import { describe, expect, it } from 'vitest'

import {
	convertHeightDraft,
	formatHeight,
	formatLengthInput,
	getLengthUnitLabel,
	heightDraft,
	heightFromDraft,
	isLengthUnit,
	parseLengthInput,
} from './length-unit'

describe('lengths in the member unit (PREF-04)', () => {
	it('labels and converts lengths, stored in centimetres', () => {
		expect(getLengthUnitLabel('CM')).toBe('cm')
		expect(getLengthUnitLabel('IN')).toBe('in')
		expect(isLengthUnit('IN')).toBe(true)
		// Radix's Select reports '' when its value changes from outside.
		expect(isLengthUnit('')).toBe(false)
		expect(formatLengthInput(84, 'CM')).toBe('84')
		expect(formatLengthInput(84, 'IN')).toBe('33.07')
		expect(formatLengthInput(null, 'IN')).toBe('')
		expect(parseLengthInput('33.07', 'IN')).toBeCloseTo(84, 1)
		expect(parseLengthInput(' 84 ', 'CM')).toBe(84)
		expect(parseLengthInput('', 'IN')).toBeUndefined()
		expect(parseLengthInput('-2', 'IN')).toBeUndefined()
		expect(parseLengthInput('abc', 'CM')).toBeUndefined()
	})

	it('reads a height in centimetres, or in feet and inches', () => {
		expect(formatHeight(182, 'CM', 'en')).toBe('182 cm')
		expect(formatHeight(182.5, 'CM', 'es')).toBe('182,5 cm')
		expect(formatHeight(182.88, 'IN', 'en')).toBe('6 ft 0 in')
		expect(formatHeight(180, 'IN', 'en')).toBe('5 ft 10.9 in')
		expect(formatHeight(180, 'IN', 'es')).toBe('5 ft 10,9 in')
		expect(formatHeight(null, 'IN', 'en')).toBe('—')
	})
})

describe('the Settings height', () => {
	it('fills one field in centimetres or two in feet and inches', () => {
		expect(heightDraft(180, 'CM')).toEqual({ cm: '180', feet: '', inches: '' })
		expect(heightDraft(180, 'IN')).toEqual({
			cm: '',
			feet: '5',
			inches: '10.9',
		})
		expect(heightDraft(null, 'IN')).toEqual({ cm: '', feet: '', inches: '' })
	})

	it('sends an untouched height back exactly as stored', () => {
		const stored = 180.3
		expect(heightFromDraft(heightDraft(stored, 'IN'), 'IN', stored)).toBe(
			stored,
		)
		expect(heightFromDraft(heightDraft(stored, 'CM'), 'CM', stored)).toBe(
			stored,
		)
		// Switching units without typing is still untouched.
		const switched = convertHeightDraft(
			heightDraft(stored, 'CM'),
			'CM',
			'IN',
			stored,
		)
		expect(heightFromDraft(switched, 'IN', stored)).toBe(stored)
	})

	it('converts a typed height to centimetres and refuses what is not one', () => {
		expect(
			heightFromDraft({ cm: '', feet: '6', inches: '0' }, 'IN', null),
		).toBe(182.88)
		expect(heightFromDraft({ cm: '', feet: '6', inches: '' }, 'IN', null)).toBe(
			182.88,
		)
		expect(
			heightFromDraft({ cm: '', feet: '', inches: '70' }, 'IN', null),
		).toBe(177.8)
		expect(
			heightFromDraft({ cm: '175', feet: '', inches: '' }, 'CM', 180),
		).toBe(175)
		expect(heightFromDraft({ cm: '', feet: '', inches: '' }, 'IN', 180)).toBe(
			null,
		)
		expect(heightFromDraft({ cm: '', feet: '', inches: '' }, 'CM', 180)).toBe(
			null,
		)
		expect(
			heightFromDraft({ cm: '', feet: '5.5', inches: '2' }, 'IN', null),
		).toBeUndefined()
		expect(
			heightFromDraft({ cm: '', feet: '5', inches: '-1' }, 'IN', null),
		).toBeUndefined()
	})

	it('carries a typed height across a unit change', () => {
		expect(
			convertHeightDraft({ cm: '', feet: '6', inches: '0' }, 'IN', 'CM', null),
		).toEqual({ cm: '182.88', feet: '', inches: '' })
		expect(
			convertHeightDraft({ cm: '170', feet: '', inches: '' }, 'CM', 'IN', null),
		).toEqual({ cm: '', feet: '5', inches: '6.9' })
	})
})
