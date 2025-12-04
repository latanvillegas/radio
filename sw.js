// sw.js
// =======================
// SERVICE WORKER v6.9 (FORCE UPDATE)
// =======================

const CACHE_NAME = 'satelital-ultra-v6.9';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/main.js',
  './js/stations.js',
  './manifest.json'
  // Si tienes iconos, inclúyelos:
  // './icons/icon-192.png',
  // './icons/icon-512.png'
];

// 1. INSTALACIÓN
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Forzar instalación inmediata
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// 2. ACTIVACIÓN (Limpieza de caché vieja)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Tomar control inmediatamente
  );
});

// 3. FETCH
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});
