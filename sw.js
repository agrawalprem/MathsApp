// Service Worker for Learning Maths in Baby Steps
// Version 1.0.34 - Add diagnostic logging to track index.js execution and function exposure

const CACHE_NAME = 'maths-app-v1.0.34';
const STATIC_CACHE_NAME = 'maths-app-static-v1.0.34';

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

// Fetch event - network first for HTML/JS/CSS to ensure updates, cache first for other assets
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
  const isHTML = request.headers.get('accept').includes('text/html');
  const isJS = url.pathname.endsWith('.js');
  const isCSS = url.pathname.endsWith('.css');
  
  // Network-first strategy for HTML, JS, and CSS to ensure immediate updates
  if (isHTML || isJS || isCSS) {
    event.respondWith(
      fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response (stream can only be consumed once)
        const responseToCache = response.clone();
        
        // Cache the response in CURRENT cache version only
        caches.open(STATIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      }).catch(() => {
        // Network failed - try to serve from CURRENT cache only
        return caches.open(STATIC_CACHE_NAME).then((cache) => {
          return cache.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If no cache and it's HTML, return index.html
            if (isHTML) {
              return cache.match('/index.html');
            }
            throw new Error('No cache available');
          });
        });
      })
    );
  } else {
    // Cache-first strategy for other assets (images, fonts, etc.)
    event.respondWith(
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version from CURRENT cache
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
            
            // Cache the response in CURRENT cache version only
            cache.put(request, responseToCache);
            
            return response;
          });
        });
      })
    );
  }
});
