// HospedaYa Service Worker — GitHub Pages compatible
// Subir la versión cada vez que cambien archivos de la app.
const CACHE_NAME = 'hospedaya-v13';

const ARCHIVOS = [
  './',
  './index.html',
  './app.js',
  './facturacionSunat.js',
  './config.js',
  './supabaseClient.js',
  './style.css',
  './manifest.json',
  './banner.jpg',
  './favicon.png',
  './apple-touch-icon.png',
  './icon-192x192.png',
  './icon-512x512.png',
];

// INSTALACIÓN: descarga la versión nueva completa
self.addEventListener('install', e => {
  console.log('[SW] Instalando', CACHE_NAME);
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ARCHIVOS).catch(err => console.warn('[SW] Error cache:', err)))
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN — limpiar cachés viejos
self.addEventListener('activate', e => {
  console.log('[SW] Activando', CACHE_NAME);
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        self.clients.matchAll({ type:'window' }).then(clients =>
          clients.forEach(c => c.postMessage({ tipo:'SW_ACTUALIZADO', version: CACHE_NAME }))
        );
      })
  );
});

// FETCH — Rendimiento: "copia guardada primero, actualizar en segundo plano".
// Antes era "internet primero": cada apertura esperaba descargar app.js (~800 KB)
// aunque ya estuviera guardado. Ahora abre al instante y la copia se refresca sola;
// una versión nueva (CACHE_NAME distinto) se instala completa y la página se recarga.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // No interceptar otros sitios (Supabase, CDNs, fuentes) ni peticiones que no sean GET
  if (e.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const guardado = await cache.match(e.request, { ignoreSearch: e.request.mode === 'navigate' });
      const deRed = fetch(e.request)
        .then(res => {
          if (res && res.status === 200) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => null);

      if (guardado) {
        e.waitUntil(deRed);          // refresca la copia sin hacer esperar al usuario
        return guardado;
      }
      const res = await deRed;
      if (res) return res;
      // Sin internet y sin copia: SPA → index.html
      return (await cache.match('./index.html')) || Response.error();
    })
  );
});

// Mensajes
self.addEventListener('message', e => {
  if (e.data?.tipo === 'SKIP_WAITING') self.skipWaiting();
});
