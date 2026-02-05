// sw.js - Service Worker v9.5
// Estrategia: Stale-While-Revalidate (Carga rápida + Actualización en segundo plano)

const CACHE_NAME = 'radio-satelital-v9.5';

// Lista exacta de archivos a guardar en la memoria del celular.
// NOTA: Las versiones (?v=9.5) coinciden con tu index.html para forzar la actualización.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css?v=9.5',
  './main.js?v=9.5',
  './stations.js?v=9.5',
  './manifest.json',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './404.html'
];

// 1. INSTALACIÓN: Se ejecuta la primera vez que entras
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando v9.5...');
  
  // Obliga al SW a activarse inmediatamente (sin esperar a cerrar la pestaña)
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando archivos del sistema...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. ACTIVACIÓN: Se ejecuta al actualizar la versión
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando y limpiando versiones antiguas...');
  
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          // Borra cualquier caché que no sea la v9.5 (ej. v8.7, v8.5)
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  // Toma el control de la página de inmediato para que funcione offline ya mismo
  return self.clients.claim();
});

// 3. FETCH: Intercepta las peticiones de red
self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') return;

  // EXCEPCIÓN IMPORTANTE: NO cachear el streaming de audio
  const url = event.request.url;
  if (url.includes('stream') || url.includes('.mp3') || url.includes('icecast') || url.includes('shoutcast')) {
    return; // Dejar pasar el audio directo a internet
  }

  // ESTRATEGIA: "Stale-While-Revalidate"
  // 1. Sirve lo que hay en memoria (Velocidad).
  // 2. Busca actualizaciones en internet en segundo plano para la próxima vez.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Si la respuesta de internet es válida, actualizamos la caché
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // SI FALLA INTERNET:
        // Si intentan navegar a una página nueva, mostrar error 404 personalizado
        if (event.request.mode === 'navigate') {
          return caches.match('./404.html');
        }
      });

      // Retorna la versión guardada si existe, si no, espera a internet
      return cachedResponse || fetchPromise;
    })
  );
});
