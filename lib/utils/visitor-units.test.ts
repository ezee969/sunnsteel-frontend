import { describe, expect, it } from 'vitest'

import { visitorUnits } from './visitor-units'

describe('visitorUnits', () => {
	it('uses pounds and inches in the United States', () => {
		expect(visitorUnits(['en-US'])).toEqual({
			weightUnit: 'LB',
			lengthUnit: 'IN',
		})
	})

	it('uses metric elsewhere, in Spanish too', () => {
		expect(visitorUnits(['es-AR'])).toEqual({
			weightUnit: 'KG',
			lengthUnit: 'CM',
		})
		expect(visitorUnits(['en-GB'])).toEqual({
			weightUnit: 'KG',
			lengthUnit: 'CM',
		})
	})

	it('reads the first language that names a region', () => {
		expect(visitorUnits(['en', 'en-US'])).toEqual({
			weightUnit: 'LB',
			lengthUnit: 'IN',
		})
	})

	it('falls back to metric with no region at all', () => {
		expect(visitorUnits(['es'])).toEqual({ weightUnit: 'KG', lengthUnit: 'CM' })
		expect(visitorUnits([])).toEqual({ weightUnit: 'KG', lengthUnit: 'CM' })
	})
})
