const CACHE_NAME = 'cgo-pymes-cache-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Almacenamos lo mínimo para que funcione offline básico y Chrome lo detecte como PWA
      return cache.addAll(['/', '/manifest.json', '/icono-cgo.png']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
