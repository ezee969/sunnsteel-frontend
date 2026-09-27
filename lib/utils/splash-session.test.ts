import { afterEach, describe, expect, it } from 'vitest'

import {
	forgetSplash,
	hasSplashPlayed,
	markSplashPlayed,
	SPLASH_SESSION_KEY,
	type SplashStorage,
} from '@/lib/utils/splash-session'

const memoryStorage = (): SplashStorage & { values: Map<string, string> } => {
	const values = new Map<string, string>()
	return {
		values,
		getItem: key => values.get(key) ?? null,
		setItem: (key, value) => void values.set(key, value),
		removeItem: key => void values.delete(key),
	}
}

const throwingStorage: SplashStorage = {
	getItem: () => {
		throw new Error('SecurityError')
	},
	setItem: () => {
		throw new Error('SecurityError')
	},
	removeItem: () => {
		throw new Error('SecurityError')
	},
}

describe('splash session', () => {
	afterEach(() => forgetSplash(null))

	it('plays on a tab that has not seen it', () => {
		expect(hasSplashPlayed(memoryStorage())).toBe(false)
	})

	it('stays played across a full reload of the same tab', () => {
		const tab = memoryStorage()
		markSplashPlayed(tab)
		expect(tab.values.get(SPLASH_SESSION_KEY)).toBe('1')

		// A reload re-evaluates every module; only the tab's storage carries over.
		forgetSplash(null)
		expect(hasSplashPlayed(tab)).toBe(true)
	})

	it('plays again after a sign-out', () => {
		const tab = memoryStorage()
		markSplashPlayed(tab)
		forgetSplash(tab)
		expect(hasSplashPlayed(tab)).toBe(false)
	})

	it('falls back to once per document when storage throws', () => {
		expect(hasSplashPlayed(throwingStorage)).toBe(false)
		expect(() => markSplashPlayed(throwingStorage)).not.toThrow()
		expect(hasSplashPlayed(throwingStorage)).toBe(true)
		expect(() => forgetSplash(throwingStorage)).not.toThrow()
		expect(hasSplashPlayed(throwingStorage)).toBe(false)
	})
})
