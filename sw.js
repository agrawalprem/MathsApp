// Service Worker for Learning Maths in Baby Steps
// Version 1.0.8 - Update this version when you want to force cache refresh

const CACHE_NAME = 'maths-app-v1.0.8';
const STATIC_CACHE_NAME = 'maths-app-static-v1.0.8';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/question.html',
  '/summary.html',
  '/student-dashboard.html',
  '/teacher-dashboard.html',
  '/shared.css',
  '/shared.js',
  '/shared_db.js',
  '/index.css',
  '/index.js',
  '/question.css',
  '/question.js',
  '/summary.css',
  '/summary.js',
  '/student-dashboard.css',
  '/student-dashboard.js',
  '/teacher-dashboard.css',
  '/teacher-dashboard.js',
  '/manifest.json'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...', CACHE_NAME);
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static files');
      return cache.addAll(STATIC_FILES).catch((error) => {
        console.warn('[Service Worker] Some files failed to cache:', error);
        // Continue even if some files fail
        return Promise.resolve();
      });
    })
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...', CACHE_NAME);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages immediately
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip cross-origin requests (like Supabase API, CDN resources)
  if (url.origin !== location.origin) {
    // For external resources (Supabase, CDN), use network-first strategy
    event.respondWith(fetch(request));
    return;
  }
  
  // For same-origin requests (our static files)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version
        return cachedResponse;
      }
      
      // Fetch from network
      return fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response (stream can only be consumed once)
        const responseToCache = response.clone();
        
        // Cache the response for future use
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // If network fails and no cache, return offline page if available
        if (request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
