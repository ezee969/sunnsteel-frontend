import { describe, expect, it } from 'vitest'

import { type InstallContext, installHelperKind } from './install-helper'

const IPHONE_SAFARI =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1'
const IPHONE_CHROME =
	'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0 Mobile/15E148 Safari/604.1'
const IPAD_AS_MAC =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'
const ANDROID_CHROME =
	'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'

const phone = (overrides: Partial<InstallContext>): InstallContext => ({
	asked: true,
	touch: true,
	standalone: false,
	promptAvailable: false,
	userAgent: ANDROID_CHROME,
	maxTouchPoints: 5,
	...overrides,
})

describe('the install helper (SITE-01 §12.12)', () => {
	it('offers the browser’s own dialog where it is available', () => {
		expect(installHelperKind(phone({ promptAvailable: true }))).toBe('prompt')
	})

	it('shows Safari’s two steps on iPhone and iPad', () => {
		expect(installHelperKind(phone({ userAgent: IPHONE_SAFARI }))).toBe('ios')
		expect(installHelperKind(phone({ userAgent: IPAD_AS_MAC }))).toBe('ios')
	})

	it('keeps to the written answer in any other phone browser', () => {
		expect(installHelperKind(phone({ userAgent: IPHONE_CHROME }))).toBe(
			'answer',
		)
		expect(installHelperKind(phone({}))).toBe('answer')
	})

	it('shows nothing unasked, in the installed app or on a computer', () => {
		expect(installHelperKind(phone({ asked: false }))).toBe('none')
		expect(installHelperKind(phone({ standalone: true }))).toBe('none')
		expect(
			installHelperKind(
				phone({ touch: false, userAgent: IPAD_AS_MAC, maxTouchPoints: 0 }),
			),
		).toBe('none')
	})
})
