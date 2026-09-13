import { describe, expect, it } from 'vitest'

import {
	getHistoryEmptyState,
	getRecentActivityEmptyState,
	hasActiveHistoryFilters,
} from '@/lib/utils/empty-states'

describe('history empty state', () => {
	it('treats membership filters as active and ignores blank search', () => {
		expect(hasActiveHistoryFilters({})).toBe(false)
		expect(hasActiveHistoryFilters({ q: '   ', routineId: '' })).toBe(false)
		expect(hasActiveHistoryFilters({ status: 'COMPLETED' })).toBe(true)
		expect(hasActiveHistoryFilters({ from: '2026-09-01' })).toBe(true)
		expect(hasActiveHistoryFilters({ q: 'bench' })).toBe(true)
	})

	it('offers to clear filters only when filters hide sessions', () => {
		expect(getHistoryEmptyState(true).action).toEqual({
			kind: 'clear-filters',
			label: 'Clear filters',
		})
		expect(getHistoryEmptyState(false).action).toEqual({
			kind: 'link',
			label: 'Choose a routine',
			href: '/routines',
		})
	})
})

describe('recent activity empty state', () => {
	it('points a member without routines to creating one', () => {
		expect(getRecentActivityEmptyState(false).action).toMatchObject({
			href: '/routines/new',
		})
		expect(getRecentActivityEmptyState(true).action).toMatchObject({
			href: '/routines',
		})
	})
})
