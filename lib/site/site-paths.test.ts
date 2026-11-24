import { describe, expect, it } from 'vitest'

import { isSitePath } from './site-paths'

describe('isSitePath', () => {
	it('answers the landing and the public pages, with or without the language', () => {
		for (const path of [
			'/',
			'/en',
			'/es/',
			'/features',
			'/en/features',
			'/features/workout-tracker',
			'/es/features/ranks',
			'/use-cases/beginners',
			'/pricing',
			'/en/pricing/',
		]) {
			expect(isSitePath(path), path).toBe(true)
		}
	})

	it('leaves every app page to the app', () => {
		for (const path of [
			'/login',
			'/signup',
			'/dashboard',
			'/en/dashboard',
			'/plans',
			'/members/ana',
			'/shared/sessions/abc',
			'/terminos',
			'/featuresx',
			'/pricing-old',
			'/offline',
			null,
			undefined,
			'',
		]) {
			expect(isSitePath(path), String(path)).toBe(false)
		}
	})
})
