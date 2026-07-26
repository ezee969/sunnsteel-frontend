// public/sw.js
// Bumped to v5 in TD-04: PRECACHE_URLS changed (the 1.76 MB /logo.png is gone,
// replaced by the 10 KB /icon-192.png), so old caches must be discarded.
const CACHE_VERSION = 'v5';
const RUNTIME_CACHE = `ss-runtime-${CACHE_VERSION}`;
const PRECACHE = `ss-precache-${CACHE_VERSION}`;
const PAGE_CACHE = `ss-pages-${CACHE_VERSION}`;

// Core assets to precache (kept minimal)
// Only the 192px icon is precached. The 512/maskable variants are fetched by
// the platform at install-to-homescreen time, not on every visit.
const PRECACHE_URLS = ['/', '/site.webmanifest', '/favicon.ico', '/icon-192.png'];

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
  '/signup'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

// Allow page to ask SW to skip waiting immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;

  // NOTE: there is deliberately no same-origin `/api/*` branch here. One used
  // to exist (cache-first with background refresh) and was unreachable: the
  // backend lives on another origin, and the only same-origin `/api/*` route is
  // `/api/session`, which accepts POST/DELETE only — while this handler returns
  // early on anything that is not a GET. It gave a false impression of offline
  // API caching. Removed in TD-13. If a same-origin `/api` proxy is ever added,
  // this is where its strategy would go.

  // HTML/navigation: Enhanced caching strategy
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        const pageCache = await caches.open(PAGE_CACHE);
        const runtimeCache = await caches.open(RUNTIME_CACHE);

        // Check if it's a critical page
        const isCriticalPage = CRITICAL_PAGES.some(page => url.pathname === page || url.pathname.startsWith(page + '/'));

        // Network-first for all pages (auth/config-sensitive pages must never
        // serve stale HTML pinned to a stale JS bundle - cache is fallback only)
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            const cache = isCriticalPage ? pageCache : runtimeCache;
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Try page cache first, then runtime cache
          const cached = await pageCache.match(request) || await runtimeCache.match(request);
          if (cached) return cached;
          
          // Fallback to root if specific page not cached
          const fallback = await caches.match('/');
          if (fallback) return fallback;
          throw err;
        }
      })()
    );
    return;
  }

  // Static assets (same-origin .js, .css, images, fonts): stale-while-revalidate
  const ASSET_PATTERN = isSameOrigin && /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf)$/i.test(url.pathname);
  if (ASSET_PATTERN) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(RUNTIME_CACHE);
        const cached = await cache.match(request);
        const networkPromise = fetch(request)
          .then((response) => {
            // Only cache successful, basic/opaque responses
            if (response && (response.status === 200 || response.type === 'opaque')) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);
        return cached || networkPromise || fetch(request);
      })()
    );
    return;
  }

  // Default: try cache, then network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
