import { describe, expect, it } from 'vitest'

import { activeTabHref, tabForHash } from './page-tabs'
import { PROGRESS_HASH_RULES, PROGRESS_TABS } from './progress-tabs'

describe('Progress tabs (UX-11)', () => {
	it('keeps the bare route as the first tab', () => {
		expect(PROGRESS_TABS[0].href).toBe('/progress')
		expect(activeTabHref(PROGRESS_TABS, '/progress')).toBe('/progress')
		expect(activeTabHref(PROGRESS_TABS, '/progress/load')).toBe(
			'/progress/load',
		)
	})

	it('sends every moved section to a tab that exists', () => {
		const tabs = new Set<string>(PROGRESS_TABS.map(tab => tab.href))
		for (const rule of PROGRESS_HASH_RULES) {
			expect(tabs.has(rule.href)).toBe(true)
			expect(rule.href).not.toBe('/progress')
		}
	})

	it('forwards the links that existed before the split', () => {
		expect(tabForHash('#body-progress', PROGRESS_HASH_RULES)).toBe(
			'/progress/body',
		)
		expect(tabForHash('#muscle-distribution', PROGRESS_HASH_RULES)).toBe(
			'/progress/load',
		)
		expect(tabForHash('#session-comparison', PROGRESS_HASH_RULES)).toBe(
			'/progress/workouts',
		)
		expect(tabForHash('#progress-timeline', PROGRESS_HASH_RULES)).toBe(
			'/progress/strength',
		)
	})

	it('leaves Overview sections on Overview', () => {
		expect(tabForHash('#training-signals', PROGRESS_HASH_RULES)).toBeNull()
		expect(tabForHash('#personal-goals', PROGRESS_HASH_RULES)).toBeNull()
	})
})
