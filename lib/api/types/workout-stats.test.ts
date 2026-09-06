import { describe, expect, it } from 'vitest'

import { getWorkoutStatsQuery } from './workout-stats.type'

describe('dashboard week boundaries', () => {
	it('uses Monday midnight through the next Monday, including on Sunday', () => {
		const query = getWorkoutStatsQuery(new Date(2026, 8, 6, 23, 59))
		expect(new Date(query.weekStart)).toEqual(new Date(2026, 7, 31))
		expect(new Date(query.weekEnd)).toEqual(new Date(2026, 8, 7))
	})
	it('changes the cache interval when Monday begins', () => {
		const before = getWorkoutStatsQuery(new Date(2026, 8, 6, 23, 59))
		const after = getWorkoutStatsQuery(new Date(2026, 8, 7))
		expect(after.weekStart).toBe(before.weekEnd)
	})
	it('uses calendar days across a daylight-saving transition', () => {
		const query = getWorkoutStatsQuery(new Date(2026, 2, 29, 12))
		expect(new Date(query.weekStart)).toEqual(new Date(2026, 2, 23))
		expect(new Date(query.weekEnd)).toEqual(new Date(2026, 2, 30))
	})
})
