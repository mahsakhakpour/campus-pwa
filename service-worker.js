/**
 * BCIT Campus Maps - Service Worker
 * Version: 2.1.0
 */

const APP_NAME = 'BCIT Campus Maps';
const CACHE_VERSION = 'v2.1.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

// Assets that are safe to cache aggressively
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',

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

// ---------------- INSTALL ----------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// ---------------- ACTIVATE ----------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.map(name => {
          if (name.startsWith(APP_NAME) && name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ---------------- FETCH ----------------
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1️⃣ CSS: network-first (THIS IS THE FIX)
  if (url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2️⃣ HTML: network-first
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put('./index.html', clone);
          });
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 3️⃣ Everything else: cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
