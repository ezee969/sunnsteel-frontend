// public/sw.js
// Bumped to v6 for NOTIF-02: the worker gained push and notificationclick
// handlers, so every client must pick up this version rather than keep serving
// from a worker that cannot receive a notification.
const CACHE_VERSION = 'v6'
const RUNTIME_CACHE = `ss-runtime-${CACHE_VERSION}`
const PRECACHE = `ss-precache-${CACHE_VERSION}`
const PAGE_CACHE = `ss-pages-${CACHE_VERSION}`
const CURRENT_CACHES = new Set([RUNTIME_CACHE, PRECACHE, PAGE_CACHE])

// Core assets to precache (kept minimal)
// Only the 192px icon is precached. The 512/maskable variants are fetched by
// the platform at install-to-homescreen time, not on every visit.
const PRECACHE_URLS = [
	'/',
	'/site.webmanifest',
	'/favicon.ico',
	'/icon-192.png',
]

// Pages whose HTML is kept in the longer-lived PAGE_CACHE rather than the
// runtime cache, so they stay available offline. They are cached as the user
// visits them - activation does NOT prefetch them (that cost 5 extra network
// requests per deploy, including /login and /signup which an authenticated
// user never sees).
const CRITICAL_PAGES = [
	'/dashboard',
	'/routines',
	'/workouts',
	'/login',
	'/signup',
]

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(PRECACHE).then(cache => cache.addAll(PRECACHE_URLS)),
	)
})

self.addEventListener('activate', event => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys()
			await Promise.all(
				keys
					.filter(key => key.startsWith('ss-') && !CURRENT_CACHES.has(key))
					.map(key => caches.delete(key)),
			)
			await self.clients.claim()
		})(),
	)
})

// Allow page to ask SW to skip waiting immediately
self.addEventListener('message', event => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		event.waitUntil(self.skipWaiting())
	}
})

self.addEventListener('fetch', event => {
	const request = event.request
	if (request.method !== 'GET') return

	const url = new URL(request.url)
	const isSameOrigin = url.origin === self.location.origin

	// NOTE: there is deliberately no same-origin `/api/*` branch here. One used
	// to exist (cache-first with background refresh) and was unreachable: the
	// backend lives on another origin, and the only same-origin `/api/*` route is
	// `/api/session`, which accepts POST/DELETE only — while this handler returns
	// early on anything that is not a GET. It gave a false impression of offline
	// API caching. Removed in TD-13. If a same-origin `/api` proxy is ever added,
	// this is where its strategy would go.
	if (!isSameOrigin) return

	// HTML/navigation: Enhanced caching strategy
	if (
		request.mode === 'navigate' ||
		(request.headers.get('accept') || '').includes('text/html')
	) {
		event.respondWith(
			(async () => {
				const pageCache = await caches.open(PAGE_CACHE)
				const runtimeCache = await caches.open(RUNTIME_CACHE)

				// Check if it's a critical page
				const isCriticalPage = CRITICAL_PAGES.some(
					page => url.pathname === page || url.pathname.startsWith(page + '/'),
				)

				// Network-first for all pages (auth/config-sensitive pages must never
				// serve stale HTML pinned to a stale JS bundle - cache is fallback only)
				try {
					const networkResponse = await fetch(request)
					if (networkResponse.ok) {
						const cache = isCriticalPage ? pageCache : runtimeCache
						await cache.put(request, networkResponse.clone())
					}
					return networkResponse
				} catch (err) {
					// Try page cache first, then runtime cache
					const cached =
						(await pageCache.match(request)) ||
						(await runtimeCache.match(request))
					if (cached) return cached

					// Fallback to root if specific page not cached
					const fallback = await caches.match('/')
					if (fallback) return fallback
					throw err
				}
			})(),
		)
		return
	}

	// Static assets (same-origin .js, .css, images, fonts): stale-while-revalidate
	const ASSET_PATTERN =
		/\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(
			url.pathname,
		)
	if (ASSET_PATTERN) {
		event.respondWith(
			(async () => {
				const cache = await caches.open(RUNTIME_CACHE)
				const cached = await cache.match(request)
				const networkPromise = fetch(request)
					.then(async response => {
						// Only cache successful, basic/opaque responses
						if (
							response &&
							(response.status === 200 || response.type === 'opaque')
						) {
							await cache.put(request, response.clone())
						}
						return response
					})
					.catch(() => undefined)
				return cached || networkPromise || fetch(request)
			})(),
		)
		return
	}

	// Default: try cache, then network
	event.respondWith(
		caches.match(request).then(cached => cached || fetch(request)),
	)
})

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

self.addEventListener('push', event => {
	// A push with no body, or one this version does not understand, must still
	// show something rather than nothing: the OS has already woken the device.
	let payload = {}
	try {
		payload = event.data ? event.data.json() : {}
	} catch {
		payload = {}
	}

	const title = payload.title || 'Sunnsteel'
	const options = {
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
	const target = (event.notification.data && event.notification.data.url) || '/'

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
				if (
					new URL(client.url).pathname === url.pathname &&
					'focus' in client
				) {
					return client.focus()
				}
			}
			const anyClient = clients.find(client => 'navigate' in client)
			if (anyClient) {
				await anyClient.focus()
				return anyClient.navigate(url.href)
			}
			return self.clients.openWindow(url.href)
		})(),
	)
})

// A subscription can be rotated by the browser at any time. The page cannot
// re-register what it never learns about, so the worker tells whichever client
// is open to send the new subscription to the server.
self.addEventListener('pushsubscriptionchange', event => {
	event.waitUntil(
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
