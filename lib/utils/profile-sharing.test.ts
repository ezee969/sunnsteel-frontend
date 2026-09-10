import { describe, expect, it } from 'vitest'

import {
	getSharedProfilePath,
	getSharedProfileUrl,
} from '@/lib/utils/profile-sharing'

describe('profile sharing', () => {
	it('builds a public route outside the authenticated profile prefix', () => {
		expect(getSharedProfilePath('atlas_lifts')).toBe('/members/atlas_lifts')
	})

	it('encodes the handle and preserves the deployment origin', () => {
		expect(
			getSharedProfileUrl('atlas lifts', 'https://sunnsteel.example/app'),
		).toBe('https://sunnsteel.example/members/atlas%20lifts')
	})
})
