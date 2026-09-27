import { describe, expect, it } from 'vitest'

import { activeTabHref, tabForHash } from './page-tabs'
import { privacySettingHref } from './settings-anchor'
import { SETTINGS_HASH_RULES, SETTINGS_TABS } from './settings-tabs'

describe('Settings tabs (UX-12)', () => {
	it('keeps the bare route as the Profile tab', () => {
		expect(SETTINGS_TABS[0]).toEqual({ href: '/settings', label: 'Profile' })
		expect(activeTabHref(SETTINGS_TABS, '/settings')).toBe('/settings')
		expect(activeTabHref(SETTINGS_TABS, '/settings/account')).toBe(
			'/settings/account',
		)
	})

	it('sends every moved card to a tab that exists', () => {
		const tabs = new Set<string>(SETTINGS_TABS.map(tab => tab.href))
		for (const rule of SETTINGS_HASH_RULES) {
			expect(tabs.has(rule.href)).toBe(true)
			expect(rule.href).not.toBe('/settings')
		}
	})

	it('forwards the links that existed before the split', () => {
		expect(tabForHash('#profile-privacy', SETTINGS_HASH_RULES)).toBe(
			'/settings/privacy',
		)
		expect(tabForHash('#activity-sharing', SETTINGS_HASH_RULES)).toBe(
			'/settings/privacy',
		)
		expect(tabForHash('#training-partners', SETTINGS_HASH_RULES)).toBe(
			'/settings/privacy',
		)
		expect(tabForHash('#privacy-bodyProgress', SETTINGS_HASH_RULES)).toBe(
			'/settings/privacy',
		)
		expect(tabForHash('#discovery-name', SETTINGS_HASH_RULES)).toBe(
			'/settings/privacy',
		)
		expect(tabForHash('#download-data', SETTINGS_HASH_RULES)).toBe(
			'/settings/account',
		)
		expect(tabForHash('#quiet-hours', SETTINGS_HASH_RULES)).toBe(
			'/settings/notifications',
		)
		expect(tabForHash('#equipment-home', SETTINGS_HASH_RULES)).toBe(
			'/settings/training',
		)
	})

	it('leaves the profile form on Profile', () => {
		expect(tabForHash('#username', SETTINGS_HASH_RULES)).toBeNull()
		expect(tabForHash('#training-experience', SETTINGS_HASH_RULES)).toBeNull()
	})

	it('points a privacy link at the Privacy tab, not the old page', () => {
		const href = privacySettingHref('workoutHistory')
		expect(href.split('#')[0]).toBe('/settings/privacy')
		expect(tabForHash(`#${href.split('#')[1]}`, SETTINGS_HASH_RULES)).toBe(
			'/settings/privacy',
		)
	})
})
