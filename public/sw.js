// public/sw.js
const CACHE_VERSION = 'v3';
const RUNTIME_CACHE = `ss-runtime-${CACHE_VERSION}`;
const PRECACHE = `ss-precache-${CACHE_VERSION}`;
const PAGE_CACHE = `ss-pages-${CACHE_VERSION}`;
const API_CACHE = `ss-api-${CACHE_VERSION}`;

// Core assets to precache (kept minimal)
const PRECACHE_URLS = ['/', '/site.webmanifest', '/favicon.ico', '/logo.png'];

// Critical pages to prefetch for PWA navigation
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
          .filter((key) => key !== PRECACHE && key !== RUNTIME_CACHE && key !== PAGE_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
      
      // Prefetch critical pages in background
      const pageCache = await caches.open(PAGE_CACHE);
      const prefetchPromises = CRITICAL_PAGES.map(async (page) => {
        try {
          const response = await fetch(page, { credentials: 'same-origin' });
          if (response.ok) {
            await pageCache.put(page, response);
          }
        } catch (error) {
          console.warn(`Failed to prefetch ${page}:`, error);
        }
      });
      await Promise.allSettled(prefetchPromises);
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

  // API calls: cache-first with background refresh for better performance
  if (isSameOrigin && url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);
        
        // Background refresh for critical data
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          })
          .catch(() => undefined);

        // Return cached first for speed, then update in background
        if (cached) {
          fetchPromise; // Fire and forget background update
          return cached;
        }
        
        // No cache, wait for network
        return fetchPromise || fetch(request);
      })()
    );
    return;
  }

  // HTML/navigation: Enhanced caching strategy
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        const pageCache = await caches.open(PAGE_CACHE);
        const runtimeCache = await caches.open(RUNTIME_CACHE);
        
        // Check if it's a critical page
        const isCriticalPage = CRITICAL_PAGES.some(page => url.pathname === page || url.pathname.startsWith(page + '/'));
        
        if (isCriticalPage) {
          // For critical pages: cache-first with background refresh
          const cached = await pageCache.match(request);
          if (cached) {
            // Background refresh
            fetch(request)
              .then(response => {
                if (response && response.ok) {
                  pageCache.put(request, response.clone());
                }
              })
              .catch(() => {});
            return cached;
          }
        }
        
        // Network-first for other pages
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
