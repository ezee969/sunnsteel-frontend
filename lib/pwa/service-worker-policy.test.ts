import { describe, expect, it } from 'vitest'

import {
	ASSET_CACHE_NAME,
	isCacheablePage,
	isCacheableStaticAsset,
	isLegacyWorkerCache,
	isNavigationRequest,
	isSunnsteelCacheName,
	PAGE_CACHE_NAME,
	SERVICE_WORKER_CACHE_ID,
	shouldDeferServiceWorkerUpdate,
} from './service-worker-policy'

const ORIGIN = 'https://sunnsteel-frontend.vercel.app'
const url = (path: string, origin = ORIGIN) => new URL(path, origin)

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

describe('the generated worker owns its caches and nothing else (TD-44)', () => {
	it('names every cache it creates under the Sunnsteel prefix', () => {
		for (const name of [
			PAGE_CACHE_NAME,
			ASSET_CACHE_NAME,
			`${SERVICE_WORKER_CACHE_ID}-precache-v2-${ORIGIN}/`,
			`${SERVICE_WORKER_CACHE_ID}-runtime-${ORIGIN}/`,
		])
			expect(isSunnsteelCacheName(name)).toBe(true)
	})

	it.each(['ss-runtime-v6', 'ss-precache-v6', 'ss-pages-v6', 'ss-runtime-v1'])(
		'removes the hand-written worker cache %s on upgrade',
		name => {
			expect(isLegacyWorkerCache(name)).toBe(true)
		},
	)

	it.each([
		PAGE_CACHE_NAME,
		ASSET_CACHE_NAME,
		`ss-precache-v2-${ORIGIN}/`,
		'ss-runtime-v6-extra',
		'other-app-runtime-v6',
		'workbox-precache-v2',
	])('keeps %s on upgrade', name => {
		expect(isLegacyWorkerCache(name)).toBe(false)
	})
})

describe('what the generated worker caches (TD-44)', () => {
	it('treats a navigation or a document request as a page', () => {
		expect(isNavigationRequest({ mode: 'navigate', destination: '' })).toBe(
			true,
		)
		expect(isNavigationRequest({ mode: 'cors', destination: 'document' })).toBe(
			true,
		)
		expect(isNavigationRequest({ mode: 'cors', destination: '' })).toBe(false)
	})

	it('keeps same-origin pages, never auth callbacks, the API or other origins', () => {
		expect(isCacheablePage(url('/dashboard'), ORIGIN)).toBe(true)
		expect(isCacheablePage(url('/auth/callback?code=x'), ORIGIN)).toBe(false)
		expect(isCacheablePage(url('/api/session'), ORIGIN)).toBe(false)
		expect(
			isCacheablePage(
				url('/', 'https://sunnsteel-backend-production.up.railway.app'),
				ORIGIN,
			),
		).toBe(false)
	})

	it('keeps same-origin static files and never backend or cross-origin responses', () => {
		expect(isCacheableStaticAsset(url('/icon-512.png'), ORIGIN)).toBe(true)
		expect(isCacheableStaticAsset(url('/backgrounds/hero.webp'), ORIGIN)).toBe(
			true,
		)
		expect(isCacheableStaticAsset(url('/dashboard'), ORIGIN)).toBe(false)
		expect(
			isCacheableStaticAsset(
				url(
					'/api/workouts/stats.json',
					'https://sunnsteel-backend-production.up.railway.app',
				),
				ORIGIN,
			),
		).toBe(false)
		expect(
			isCacheableStaticAsset(
				url('/avatars/me.jpg', 'https://project.supabase.co'),
				ORIGIN,
			),
		).toBe(false)
	})
})
