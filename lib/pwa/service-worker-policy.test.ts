import { describe, expect, it } from 'vitest'

import {
	isSunnsteelCacheName,
	shouldDeferServiceWorkerUpdate,
} from './service-worker-policy'

describe('service worker policy', () => {
	it.each([
		'ss-precache-v5',
		'ss-runtime-v5',
		'ss-pages-v5',
		'ss-any-future-cache',
	])('recognizes Sunnsteel cache %s', cacheName => {
		expect(isSunnsteelCacheName(cacheName)).toBe(true)
	})

	it.each(['next-data', 'workbox-precache', 'other-app-cache', ''])(
		'does not claim unrelated cache %s',
		cacheName => {
			expect(isSunnsteelCacheName(cacheName)).toBe(false)
		},
	)

	it.each([
		'/workouts/sessions/session-123',
		'/workouts/sessions/session-123/exercise',
	])('defers an update on active workout route %s', pathname => {
		expect(shouldDeferServiceWorkerUpdate(pathname)).toBe(true)
	})

	it.each([
		'/workouts',
		'/workouts/history',
		'/workouts/history/session-123',
		'/dashboard',
	])('allows an update away from active workout route %s', pathname => {
		expect(shouldDeferServiceWorkerUpdate(pathname)).toBe(false)
	})
})
