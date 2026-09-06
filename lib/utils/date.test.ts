import { describe, expect, it } from 'vitest'

import { describeDaysAway, nextScheduledDay } from './date'

// 0=Sun .. 6=Sat. The upper/lower split trains Mon, Tue, Thu, Fri.
const UPPER_LOWER = [
	{ dayOfWeek: 1 },
	{ dayOfWeek: 2 },
	{ dayOfWeek: 4 },
	{ dayOfWeek: 5 },
]

describe('nextScheduledDay', () => {
	it('reports zero days away when the routine trains today', () => {
		expect(nextScheduledDay(UPPER_LOWER, 4)).toEqual({
			dayOfWeek: 4,
			daysAway: 0,
		})
	})

	it('picks the soonest day and wraps around the week', () => {
		// Wednesday -> Thursday
		expect(nextScheduledDay(UPPER_LOWER, 3)).toEqual({
			dayOfWeek: 4,
			daysAway: 1,
		})
		// Saturday -> Monday, wrapping past Sunday
		expect(nextScheduledDay(UPPER_LOWER, 6)).toEqual({
			dayOfWeek: 1,
			daysAway: 2,
		})
	})

	it('returns null when no training days are configured', () => {
		expect(nextScheduledDay([], 1)).toBeNull()
		expect(nextScheduledDay(undefined, 1)).toBeNull()
	})
})

describe('describeDaysAway', () => {
	it('uses relative wording for today and tomorrow', () => {
		expect(describeDaysAway(4, 0)).toBe('Today')
		expect(describeDaysAway(5, 1)).toBe('Tomorrow')
	})

	it('names the weekday beyond tomorrow', () => {
		expect(describeDaysAway(1, 2)).toBe('Monday')
	})
})
