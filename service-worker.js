/**
 * BCIT Campus Maps - Service Worker
 * Version: 2.0.0
 */

const APP_NAME = 'BCIT Campus Maps';
const CACHE_VERSION = 'v2.0.0';
const CACHE_NAME = `${APP_NAME}-${CACHE_VERSION}`;

// Core assets to cache on install
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './robots.txt',
  
  // CSS
  './css/style.css',
  
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
 * Install event - cache core assets
 */
self.addEventListener('install', event => {
  console.log(`[Service Worker] Installing ${APP_NAME} ${CACHE_VERSION}`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating new version');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName.startsWith(APP_NAME) && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - cache-first strategy with network fallback
 */
self.addEventListener('fetch', event => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== 'GET' || 
      event.request.url.startsWith('chrome-extension://')) {
    return;
  }
  
  // Skip browser-sync during development
  if (event.request.url.includes('browser-sync')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return cachedResponse;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the new response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log('[Service Worker] Caching new resource:', event.request.url);
              });
            
            return response;
          })
          .catch(error => {
            console.log('[Service Worker] Network request failed:', error);
            
            // Provide fallback for different file types
            const url = new URL(event.request.url);
            const extension = url.pathname.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
              return caches.match('./images/1.jpg')
                .then(fallback => {
                  if (fallback) {
                    console.log('[Service Worker] Serving fallback image');
                    return fallback;
                  }
                  throw new Error('No fallback available');
                });
            }
            
            // For HTML pages, return offline page
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match('./index.html');
            }
            
            throw error;
          });
      })
  );
});

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    event.waitUntil(
      caches.has(CACHE_NAME)
        .then(hasCache => {
          event.ports[0].postMessage({
            type: 'CACHE_STATUS',
            hasCache: hasCache,
            version: CACHE_VERSION
          });
        })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME)
        .then(() => {
          event.ports[0].postMessage({
            type: 'CACHE_CLEARED',
            success: true
          });
        })
    );
  }
});
