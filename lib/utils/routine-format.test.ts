import { describe, expect, it } from 'vitest'

import { formatDaysPerWeek } from './routine-format'

describe('formatDaysPerWeek', () => {
	it.each([
		{ days: 0, expected: '0 days/week' },
		{ days: 1, expected: '1 day/week' },
		{ days: 4, expected: '4 days/week' },
	])('formats $days as $expected', ({ days, expected }) => {
		expect(formatDaysPerWeek(days)).toBe(expected)
	})
})
