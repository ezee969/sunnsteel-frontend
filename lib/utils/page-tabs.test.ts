import { describe, expect, it } from 'vitest'

import { activeTabHref, type HashRule, tabForHash } from './page-tabs'

describe('the current page tab (UX-10)', () => {
	const progress = [
		{ href: '/progress' },
		{ href: '/progress/strength' },
		{ href: '/progress/body' },
	]

	it('matches the path exactly', () => {
		expect(activeTabHref(progress, '/progress')).toBe('/progress')
		expect(activeTabHref(progress, '/progress/body')).toBe('/progress/body')
		expect(activeTabHref(progress, '/progress/elsewhere')).toBeNull()
	})

	it('lets a tab that names a query win over the bare path', () => {
		const activity = [{ href: '/activity' }, { href: '/activity?view=yours' }]
		expect(activeTabHref(activity, '/activity', '')).toBe('/activity')
		expect(activeTabHref(activity, '/activity', '?view=yours')).toBe(
			'/activity?view=yours',
		)
		expect(activeTabHref(activity, '/activity', 'view=other')).toBe('/activity')
		expect(
			activeTabHref(activity, '/activity', new URLSearchParams('view=yours')),
		).toBe('/activity?view=yours')
	})
})

describe('sending an old anchor to its tab (UX-10)', () => {
	const rules: HashRule[] = [
		{ id: 'download-data', href: '/settings/account' },
		{ id: 'privacy-overview-discovery', href: '/settings/privacy' },
		{ prefix: 'privacy-', href: '/settings/privacy' },
		{ id: 'privacy-special', href: '/settings/account' },
	]

	it('finds an exact id', () => {
		expect(tabForHash('#download-data', rules)).toBe('/settings/account')
	})

	it('finds a family of ids by prefix', () => {
		expect(tabForHash('#privacy-workoutHistory', rules)).toBe(
			'/settings/privacy',
		)
	})

	it('checks exact ids before prefixes', () => {
		expect(tabForHash('#privacy-special', rules)).toBe('/settings/account')
	})

	it('leaves an unknown or empty hash where it is', () => {
		expect(tabForHash('#avatar-upload', rules)).toBeNull()
		expect(tabForHash('', rules)).toBeNull()
		expect(tabForHash('#', rules)).toBeNull()
	})
})
