// Service Worker per Cattura Ricette PWA
// Gestisce l'installazione + cache offline dei file dell'app

const CACHE_NAME = 'cattura-ricette-v4';
const CORE_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installazione: cache dei file core (se qualcuno manca, non blocca l'install)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        CORE_FILES.map((url) =>
          cache.add(url).catch((err) => console.warn('Cache skip:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// Attivazione: pulisce cache vecchie
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first con fallback network (e cache runtime per CDN)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
