import { describe, expect, it } from 'vitest'

import { translatorFor } from '@/i18n/translator'
import {
	getHistoryEmptyState,
	getRecentActivityEmptyState,
	hasActiveHistoryFilters,
} from '@/lib/utils/empty-states'

const en = translatorFor('en', 'planning.emptyStates')
const es = translatorFor('es', 'planning.emptyStates')

describe('history empty state', () => {
	it('treats membership filters as active and ignores blank search', () => {
		expect(hasActiveHistoryFilters({})).toBe(false)
		expect(hasActiveHistoryFilters({ q: '   ', routineId: '' })).toBe(false)
		expect(hasActiveHistoryFilters({ status: 'COMPLETED' })).toBe(true)
		expect(hasActiveHistoryFilters({ from: '2026-09-01' })).toBe(true)
		expect(hasActiveHistoryFilters({ q: 'bench' })).toBe(true)
	})

	it('offers to clear filters only when filters hide sessions', () => {
		expect(getHistoryEmptyState(true, en).action).toEqual({
			kind: 'clear-filters',
			label: 'Clear filters',
		})
		expect(getHistoryEmptyState(false, en).action).toEqual({
			kind: 'link',
			label: 'Choose a routine',
			href: '/routines',
		})
	})
})

describe('recent activity empty state', () => {
	it('points a member without routines to creating one', () => {
		expect(getRecentActivityEmptyState(false, en).action).toMatchObject({
			href: '/routines/new',
		})
		expect(getRecentActivityEmptyState(true, en).action).toMatchObject({
			href: '/routines',
		})
	})
})

describe('the same empty states in Spanish (I18N-04)', () => {
	it('keeps the action a member can take, whatever the language', () => {
		expect(getHistoryEmptyState(true, es).action).toEqual({
			kind: 'clear-filters',
			label: 'Quitar los filtros',
		})
		// The destination is a route, never copy, so it never changes.
		expect(getHistoryEmptyState(false, es).action).toMatchObject({
			href: '/routines',
		})
		expect(getRecentActivityEmptyState(false, es).action).toMatchObject({
			href: '/routines/new',
		})
		expect(getRecentActivityEmptyState(true, es).title).toBe(
			'Todavía no hay entrenamientos terminados',
		)
	})
})
