import { describe, expect, it } from 'vitest'

import { chargesFileName, previousMonth } from './charges-download'

describe('previousMonth', () => {
	it('offers the month before the current one', () => {
		expect(previousMonth(new Date(2026, 11, 18))).toBe('2026-11')
		expect(previousMonth(new Date(2026, 10, 1))).toBe('2026-10')
	})

	it('goes back a year in January', () => {
		expect(previousMonth(new Date(2027, 0, 5))).toBe('2026-12')
	})
})

describe('chargesFileName', () => {
	it('names the file for the month', () => {
		expect(chargesFileName('2026-11')).toBe('cobros-2026-11.csv')
	})
})
