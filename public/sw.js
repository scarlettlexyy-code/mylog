/**
 * MYlog Service Worker (PRD Section 7 Strict Compliance)
 * - Caches ONLY safe static app shell assets (CSS, JS bundles, icons)
 * - NEVER caches API responses, operational cost data, audit trails, or PDFs
 * - Direct bypass for /api/* routes
 */

const CACHE_NAME = 'mylog-shell-v1.3.0';

const STATIC_SHELL_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event: Pre-cache static shell only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_SHELL_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: Invalidate old shell versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first, STRICTLY BYPASS FOR API ROUTES
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // PRD Section 7 Guard: DO NOT CACHE SENSITIVE API OR COST DATA
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('pdf') ||
    url.pathname.includes('auth') ||
    event.request.method !== 'GET'
  ) {
    // Network-only, no caching
    return;
  }

  // Static shell assets: Stale-while-revalidate or Network-first
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Cache only static scripts and styles
        if (
          networkResponse.status === 200 &&
          (url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff2'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback to pre-cached shell
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          // If offline and requesting navigation, return basic offline message
          if (event.request.mode === 'navigate') {
            return new Response(
              `<!DOCTYPE html>
              <html lang="id">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>MYlog — Offline</title>
                <style>
                  body { font-family: sans-serif; background: #f8f9ff; color: #0b1c30; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; text-align: center; }
                  .card { background: white; padding: 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 400px; }
                  h1 { font-size: 20px; margin-bottom: 8px; }
                  p { font-size: 14px; color: #45464d; line-height: 1.5; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>Anda Sedang Offline</h1>
                  <p>Hubungkan kembali ke internet untuk melihat atau mengubah data operasional MYlog.</p>
                </div>
              </body>
              </html>`,
              {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              }
            );
          }
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
