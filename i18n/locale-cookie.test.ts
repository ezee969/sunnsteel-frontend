import { describe, expect, it } from 'vitest'

import { localeCookieValue } from './locale-cookie'

describe('the locale cookie (I18N-02)', () => {
	it('stores a chosen language for a year, site-wide', () => {
		expect(localeCookieValue('es')).toBe(
			'ss-locale=es; Path=/; Max-Age=31536000; SameSite=Lax',
		)
	})

	it('clears itself when the account follows the device', () => {
		expect(localeCookieValue(null)).toBe(
			'ss-locale=; Path=/; Max-Age=0; SameSite=Lax',
		)
	})
})
