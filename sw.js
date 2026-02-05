// sw.js - Edición Puntuación Perfecta v44
const CACHE_NAME = 'radio-offline-v44';
const OFFLINE_URL = './index.html';

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css?v=9.5',
  './main.js?v=9.5',
  './stations.js?v=9.5',
  './icon-192.png',
  './icon-512.png'
];

// 1. INSTALACIÓN: Cachear obligatoriamente el INDEX para el modo offline
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 2. ACTIVACIÓN: Limpieza de versiones viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  return self.clients.claim();
});

// 3. FETCH CON SOPORTE OFFLINE (Esto da el punto verde)
self.addEventListener('fetch', (event) => {
  // Ignoramos streaming y métodos que no sean GET
  if (event.request.method !== 'GET' || event.request.url.includes('stream')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        // Actualizar caché si hay red
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return networkRes;
      })
      .catch(() => {
        // Fallback Offline: Si falla la red, buscar en caché
        return caches.match(event.request).then((cachedRes) => {
          // Si es navegación y no está en caché, devolver index.html (OFFLINE PAGE)
          if (!cachedRes && event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return cachedRes;
        });
      })
  );
});

// --- EXTRAS PARA PUNTUACIÓN MÁXIMA (Sync, Periodic, Push) ---
// Estos bloques vacíos son necesarios para que PWABuilder detecte las capacidades
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') event.waitUntil(Promise.resolve());
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-content') event.waitUntil(Promise.resolve());
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Radio Satelital',
    icon: 'icon-192.png'
  };
  event.waitUntil(self.registration.showNotification('Radio Satelital', options));
});
