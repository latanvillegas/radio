// sw.js v9.8 - Service Worker Definitivo
const CACHE_NAME = 'radio-v9.8-final';
const OFFLINE_URL = './index.html';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './style.css?v=9.5',
  './main.js?v=9.5',
  './stations.js?v=9.5',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intentamos cachear todo, pero si falla uno no rompemos la instalación
      return cache.addAll(CORE_ASSETS).catch(err => console.log('Warn: Fallo caché parcial', err));
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar streaming de audio
  if (event.request.method !== 'GET' || event.request.url.includes('stream') || event.request.url.includes('.mp3')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Guardar copia fresca si hay internet
        const resClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return networkResponse;
      })
      .catch(() => {
        // Fallback offline
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match(OFFLINE_URL);
        });
      })
  );
});
