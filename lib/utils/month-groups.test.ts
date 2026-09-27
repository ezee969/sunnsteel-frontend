import { describe, expect, it } from 'vitest'

import { groupByMonth, monthKey } from './month-groups'

const at = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12)

describe('month landmarks in a long list (UX-03)', () => {
	it('splits rows at each change of local month, keeping their order', () => {
		const rows = [
			{ id: 'a', startedAt: at(2026, 9, 27) },
			{ id: 'b', startedAt: at(2026, 9, 2) },
			{ id: 'c', startedAt: at(2026, 8, 30) },
			{ id: 'd', startedAt: at(2025, 12, 31) },
		]
		const groups = groupByMonth(rows, r => r.startedAt, 'en-GB')
		expect(groups.map(g => g.key)).toEqual(['2026-09', '2026-08', '2025-12'])
		expect(groups.map(g => g.items.map(r => r.id))).toEqual([
			['a', 'b'],
			['c'],
			['d'],
		])
		expect(groups[0].label).toBe('September 2026')
	})

	it('never reorders a list that goes back and forth between months', () => {
		const rows = [at(2026, 9, 1), at(2026, 8, 31), at(2026, 9, 3)]
		expect(groupByMonth(rows, d => d, 'en-GB').map(g => g.key)).toEqual([
			'2026-09',
			'2026-08',
			'2026-09',
		])
	})

	it('reads an ISO string in the local time zone', () => {
		const d = at(2026, 1, 1)
		expect(monthKey(new Date(d.toISOString()))).toBe('2026-01')
	})

	it('has nothing to split in an empty list', () => {
		expect(groupByMonth([], () => new Date())).toEqual([])
	})
})
