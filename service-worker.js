/**
 * BCIT Campus Maps - Service Worker
 * Version: 3.0.0
 */

const APP_NAME = 'BCIT Campus Maps';
const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

// Assets to cache
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  
  // CSS
  './css/style.css',
  
  // JS
  './js/app.js',
  
  // Images
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
 * Install - cache core assets
 */
self.addEventListener('install', event => {
  console.log(`[SW] Installing ${APP_NAME} ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate - delete old caches
 */
self.addEventListener('activate', event => {
  console.log(`[SW] Activating ${CACHE_VERSION}`);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key.startsWith(APP_NAME) && key !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

/**
 * Fetch - cache first, then network
 */
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => {
          // Fallbacks
          const url = new URL(event.request.url);
          const ext = url.pathname.split('.').pop().toLowerCase();

          if (['jpg','jpeg','png','gif'].includes(ext)) {
            return caches.match('./images/1.jpg');
          }

          if (event.request.headers.get('Accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
    })
  );
});

/**
 * Message - allow clearing cache manually
 */
self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED', success: true });
    });
  }
});
