import { describe, expect, it } from 'vitest'

import {
	hashTargetId,
	hashTargetPlacement,
	privacySettingHref,
} from './settings-anchor'

describe('settings anchors (TD-55)', () => {
	it('reads the id a hash names', () => {
		expect(hashTargetId('#profile-privacy')).toBe('profile-privacy')
		expect(hashTargetId('privacy-workoutHistory')).toBe(
			'privacy-workoutHistory',
		)
		expect(hashTargetId('#a%20b')).toBe('a b')
	})

	it('names nothing for an empty or malformed hash', () => {
		expect(hashTargetId('')).toBeNull()
		expect(hashTargetId('#')).toBeNull()
		expect(hashTargetId('#%E0%A4%A')).toBeNull()
	})

	it('centres and focuses a control, and tops a section', () => {
		expect(hashTargetPlacement('BUTTON')).toBe('control')
		expect(hashTargetPlacement('select')).toBe('control')
		expect(hashTargetPlacement('DIV')).toBe('section')
		expect(hashTargetPlacement('SECTION')).toBe('section')
	})

	it('links to the select that decides a profile section', () => {
		expect(privacySettingHref('workoutHistory')).toBe(
			'/settings/privacy#privacy-workoutHistory',
		)
		expect(privacySettingHref('routines')).toBe(
			'/settings/privacy#privacy-routines',
		)
	})
})
