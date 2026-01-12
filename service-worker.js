/**
 * BCIT Campus Maps - Service Worker
 * Version: 3.0.0
 */

const APP_NAME = 'BCIT Campus Maps';
const CACHE_VERSION = 'v3.0.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

// Core assets to cache
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  './js/app.js',
  './images/1.jpg',
  './images/2.jpg',
  './images/3.jpg',
  './images/4.jpg',
  './images/5.jpg',
  './images/icons/icon-72.png',
  './images/icons/icon-96.png',
  './images/icons/icon-128.png',
  './images/icons/icon-144.png',
  './images/icons/icon-192.png',
  './images/icons/icon-256.png',
  './images/icons/icon-384.png',
  './images/icons/icon-512.png'
];

/** Install event */
self.addEventListener('install', event => {
  console.log(`[Service Worker] Installing ${APP_NAME} ${CACHE_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

/** Activate event */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name.startsWith(APP_NAME) && name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/** Fetch event */
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // همیشه CSS جدید رو از شبکه بگیر
  if (url.endsWith('style.css?v=3.0.0')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // بقیه فایل‌ها با cache-first
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return response;
      }).catch(() => {
        // fallback برای HTML
        if (event.request.headers.get('Accept').includes('text/html')) {
          return caches.match('./index.html');
        }

        // fallback برای عکس‌ها
        if (/\.(jpg|jpeg|png|gif)$/.test(url)) {
          return caches.match('./images/1.jpg');
        }
      });
    })
  );
});

/** Message event */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ type: 'CACHE_CLEARED', success: true });
      })
    );
  }
});
