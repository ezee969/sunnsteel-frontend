// public/sw.js
const CACHE_VERSION = 'v2';
const RUNTIME_CACHE = `ss-runtime-${CACHE_VERSION}`;
const PRECACHE = `ss-precache-${CACHE_VERSION}`;

// Core assets to precache (kept minimal)
const PRECACHE_URLS = ['/', '/site.webmanifest', '/favicon.ico', '/logo.png'];

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
          .filter((key) => key !== PRECACHE && key !== RUNTIME_CACHE)
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

  // HTML/navigation: network-first for freshness, fallback to cache
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          const cached = await caches.match(request);
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
