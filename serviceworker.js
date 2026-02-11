const CACHE_NAME = 'level-up-v2.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/js/state.js',
  '/js/config.js',
  '/js/utils.js',
  '/js/firebase.js',
  '/js/xp.js',
  '/js/auth.js',
  '/js/quests.js',
  '/js/timer.js',
  '/js/journal.js',
  '/js/achievements.js',
  '/js/analytics.js',
  '/js/dashboard.js',
  '/js/identity.js',
  '/js/settings.js',
  '/js/navigation.js',
  '/js/ui.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Network-first for Firebase, cache-first for app assets
  const url = new URL(event.request.url);
  
  if (url.hostname.includes('firebase') || url.hostname.includes('gstatic')) {
    // Network-first for Firebase
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first for app assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then(
            (response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              return response;
            }
          );
        })
    );
  }
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
