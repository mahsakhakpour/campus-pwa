/**
 * BCIT Campus Maps - Service Worker
 * Version: 2.1.0
 */

const APP_NAME = 'BCIT Campus Maps';
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

// Core assets to cache on install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',

  // JavaScript
  './js/app.js',

  // Images - Campus maps
  './images/1.jpg',
  './images/2.jpg',
  './images/3.jpg',
  './images/4.jpg',
  './images/5.jpg',

  // Icons
  './images/icons/icon-72.png',
  './images/icons/icon-96.png',
  './images/icons/icon-128.png',
  './images/icons/icon-144.png',
  './images/icons/icon-192.png',
  './images/icons/icon-256.png',
  './images/icons/icon-384.png',
  './images/icons/icon-512.png'
];

/**
 * Install event
 */
self.addEventListener('install', event => {
  console.log(`[Service Worker] Installing ${CACHE_NAME}`);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate event - clean old caches
 */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating');

  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache.startsWith(APP_NAME) && cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Fetch event
 */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);

  /* ===== CSS: Network first (IMPORTANT FIX) ===== */
  if (requestUrl.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  /* ===== HTML & Images: Cache first ===== */
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(response => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });

            return response;
          })
          .catch(() => {
            if (event.request.headers.get('Accept')?.includes('text/html')) {
              return caches.match('./index.html');
            }

            if (event.request.destination === 'image') {
              return caches.match('./images/1.jpg');
            }
          });
      })
  );
});

/**
 * Message event
 */
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
