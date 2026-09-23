/// <reference lib="webworker" />
// TD-44: Sunnsteel's service worker, compiled by @serwist/next into
// public/sw.js at build time. The precache list is the build's own
// content-revisioned manifest (self.__SW_MANIFEST), so there is no hand-kept
// cache version or asset list to bump. What stays hand-written is policy:
// which requests are cached and how (lib/pwa/service-worker-policy.ts), the
// clean-up of the old worker's caches, and the push handlers.
//
// Registration, update and reload stay in providers/pwa-provider.tsx:
// skipWaiting is off, so a new worker waits until the page sends SKIP_WAITING
// (which Serwist answers), and the page never sends it during a workout.

import {
	ExpirationPlugin,
	NetworkFirst,
	type PrecacheEntry,
	Serwist,
	type SerwistGlobalConfig,
	setCacheNameDetails,
	StaleWhileRevalidate,
} from 'serwist'

import {
	ASSET_CACHE_NAME,
	isCacheablePage,
	isCacheableStaticAsset,
	isLegacyWorkerCache,
	isNavigationRequest,
	OFFLINE_PAGE_URL,
	PAGE_CACHE_NAME,
	SERVICE_WORKER_CACHE_ID,
} from '../lib/pwa/service-worker-policy'

declare global {
	interface WorkerGlobalScope extends SerwistGlobalConfig {
		__SW_MANIFEST: (PrecacheEntry | string)[] | undefined
	}
}

declare const self: ServiceWorkerGlobalScope

// Before the Serwist instance is built: its precache strategy reads the cache
// name when it is constructed, and `cacheId` alone is applied too late for it,
// leaving the precache as `serwist-precache-…` -- a name development cleanup
// (which clears `ss-*` only) would never remove.
setCacheNameDetails({ prefix: SERVICE_WORKER_CACHE_ID })

const serwist = new Serwist({
	precacheEntries: self.__SW_MANIFEST,
	precacheOptions: { cleanupOutdatedCaches: true },
	cacheId: SERVICE_WORKER_CACHE_ID,
	skipWaiting: false,
	// The old worker claimed clients on activation too; keeping it means the
	// provider's controllerchange reload still happens exactly once.
	clientsClaim: true,
	navigationPreload: false,
	runtimeCaching: [
		{
			matcher: ({ request, url }) =>
				isNavigationRequest(request) &&
				isCacheablePage(url, self.location.origin),
			handler: new NetworkFirst({
				cacheName: PAGE_CACHE_NAME,
				plugins: [
					new ExpirationPlugin({
						maxEntries: 50,
						maxAgeSeconds: 30 * 24 * 60 * 60,
					}),
				],
			}),
		},
		{
			matcher: ({ url }) => isCacheableStaticAsset(url, self.location.origin),
			handler: new StaleWhileRevalidate({
				cacheName: ASSET_CACHE_NAME,
				plugins: [new ExpirationPlugin({ maxEntries: 200 })],
			}),
		},
		// Anything else -- the backend, other origins, RSC fetches -- has no
		// route and goes straight to the network, never into Cache Storage.
	],
	fallbacks: {
		entries: [
			{
				url: OFFLINE_PAGE_URL,
				matcher: ({ request }) => request.destination === 'document',
			},
		],
	},
})

// The hand-written worker's caches (ss-*-v6 and older) are removed once, when
// this worker activates. Only those names: Cache Storage is origin-wide, and
// another application's caches are not ours to clear.
self.addEventListener('activate', event => {
	event.waitUntil(
		caches
			.keys()
			.then(keys =>
				Promise.all(
					keys.filter(isLegacyWorkerCache).map(key => caches.delete(key)),
				),
			),
	)
})

serwist.addEventListeners()

// NOTIF-02/NOTIF-03 -----------------------------------------------------------
//
// A rest alert exists because the page cannot make a sound once the phone is
// locked: LIVE-01's tone is WebAudio inside the document, and a backgrounded
// PWA has its audio context suspended and its timers throttled. Only the OS can
// ring then, and only a push can ask it to.

const NOTIFICATION_DEFAULTS = {
	icon: '/icon-192.png',
	badge: '/icon-192.png',
	// The alert is the point; a silent one would defeat the whole feature.
	silent: false,
	vibrate: [120, 60, 120],
}

interface PushPayload {
	title?: string
	body?: string
	tag?: string
	url?: string
}

self.addEventListener('push', event => {
	// A push with no body, or one this version does not understand, must still
	// show something rather than nothing: the OS has already woken the device.
	let payload: PushPayload = {}
	try {
		payload = event.data ? (event.data.json() as PushPayload) : {}
	} catch {
		payload = {}
	}

	const title = payload.title || 'Sunnsteel'
	const options: NotificationOptions & {
		renotify?: boolean
		vibrate?: number[]
	} = {
		...NOTIFICATION_DEFAULTS,
		body: payload.body || '',
		tag: payload.tag || 'sunnsteel',
		// Replace an older alert for the same session instead of stacking two.
		renotify: Boolean(payload.tag),
		data: { url: payload.url || '/dashboard' },
	}

	event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
	event.notification.close()
	const target =
		(event.notification.data as { url?: string } | null)?.url || '/'

	event.waitUntil(
		(async () => {
			const url = new URL(target, self.location.origin)
			const clients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true,
			})

			// Focusing the open session beats opening a second copy of it: the
			// athlete is mid-workout and the running page holds the live timer.
			for (const client of clients) {
				if (new URL(client.url).pathname === url.pathname) {
					await client.focus()
					return
				}
			}
			const anyClient = clients[0]
			if (anyClient) {
				await anyClient.focus()
				await anyClient.navigate(url.href)
				return
			}
			await self.clients.openWindow(url.href)
		})(),
	)
})

// A subscription can be rotated by the browser at any time. The page cannot
// re-register what it never learns about, so the worker tells whichever client
// is open to send the new subscription to the server.
self.addEventListener('pushsubscriptionchange', event => {
	;(event as ExtendableEvent).waitUntil(
		(async () => {
			const clients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true,
			})
			for (const client of clients) {
				client.postMessage({ type: 'PUSH_SUBSCRIPTION_CHANGED' })
			}
		})(),
	)
})
