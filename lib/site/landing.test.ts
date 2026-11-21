import { describe, expect, it } from 'vitest'

import { rootDecision, siteLandingLive } from './landing'

const base = {
	signedIn: false,
	live: false,
	previewCookie: undefined,
	previewParam: null,
}

describe('who sees the landing at the root (SITE-01)', () => {
	it('keeps Login for a signed-out visitor until the landing is live', () => {
		expect(rootDecision(base)).toEqual({ kind: 'login' })
	})

	it('shows the landing once live, or with the preview cookie', () => {
		expect(rootDecision({ ...base, live: true })).toEqual({ kind: 'landing' })
		expect(rootDecision({ ...base, previewCookie: '1' })).toEqual({
			kind: 'landing',
		})
	})

	it('always sends a signed-in visitor to the dashboard', () => {
		expect(rootDecision({ ...base, signedIn: true, live: true })).toEqual({
			kind: 'dashboard',
		})
	})

	it('reads the preview switch before anything else', () => {
		expect(rootDecision({ ...base, previewParam: '1' })).toEqual({
			kind: 'preview',
			on: true,
		})
		expect(rootDecision({ ...base, previewParam: '0' })).toEqual({
			kind: 'preview',
			on: false,
		})
		expect(rootDecision({ ...base, previewParam: 'yes' })).toEqual({
			kind: 'login',
		})
	})

	it('is live only when SITE_LANDING is on', () => {
		expect(siteLandingLive({ SITE_LANDING: 'on' })).toBe(true)
		expect(siteLandingLive({})).toBe(false)
		expect(siteLandingLive({ SITE_LANDING: 'true' })).toBe(false)
	})
})
