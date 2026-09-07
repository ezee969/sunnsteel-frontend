import { describe, expect, it } from 'vitest'

import {
	areCanonicalWeightsEqual,
	displayWeightToKilograms,
	formatWeight,
	formatWeightInput,
	getWeightUnitLabel,
	kilogramsToDisplayWeight,
	parseWeightInput,
	stepCanonicalWeight,
} from './weight-unit'

describe('weight-unit conversion boundary', () => {
	it('keeps kilograms unchanged', () => {
		expect(kilogramsToDisplayWeight(80, 'KG')).toBe(80)
		expect(displayWeightToKilograms(80, 'KG')).toBe(80)
	})

	it('converts canonical kilograms to pounds and back', () => {
		expect(kilogramsToDisplayWeight(100, 'LB')).toBeCloseTo(220.4623, 4)
		expect(displayWeightToKilograms(220.4623, 'LB')).toBeCloseTo(100, 4)
	})

	it('formats editable values without exposing floating-point noise', () => {
		expect(formatWeightInput(80, 'KG')).toBe('80')
		expect(formatWeightInput(80, 'LB')).toBe('176.37')
	})

	it('parses entered pounds back into canonical kilograms', () => {
		expect(parseWeightInput('176.37', 'LB')).toBeCloseTo(80, 3)
		expect(parseWeightInput('', 'LB')).toBeUndefined()
		expect(parseWeightInput('-1', 'KG')).toBeUndefined()
	})

	it('treats harmless conversion noise as the same canonical weight', () => {
		expect(areCanonicalWeightsEqual(80, 79.998)).toBe(true)
		expect(areCanonicalWeightsEqual(80, 79.997)).toBe(false)

		const roundedPounds = Number(formatWeightInput(80, 'LB'))
		expect(
			areCanonicalWeightsEqual(
				80,
				displayWeightToKilograms(roundedPounds, 'LB'),
			),
		).toBe(true)
		expect(
			areCanonicalWeightsEqual(
				80,
				displayWeightToKilograms(roundedPounds + 0.01, 'LB'),
			),
		).toBe(false)
	})

	it('formats values with the selected unit and preserves empty weight', () => {
		expect(formatWeight(100, 'LB')).toBe('220.46 lb')
		expect(formatWeight(100, 'KG')).toBe('100 kg')
		expect(formatWeight(0, 'LB')).toBe('—')
		expect(getWeightUnitLabel('LB')).toBe('lb')
	})

	it('steps in user-facing increments while retaining canonical storage', () => {
		expect(stepCanonicalWeight(100, 'KG', 1)).toBe(100.5)
		expect(
			kilogramsToDisplayWeight(stepCanonicalWeight(100, 'LB', 1), 'LB'),
		).toBeCloseTo(221.46, 2)
	})
})
