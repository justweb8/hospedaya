// HospedaYa Service Worker — GitHub Pages compatible
const CACHE_NAME = 'hospedaya-v2';

const ARCHIVOS = [
  './',
  './index.html',
  './app.js',
  './facturacionSunat.js',
  './config.js',
  './supabaseClient.js',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png',
];

// INSTALACIÓN
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

// FETCH — Network First con fallback a caché
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // No interceptar externos ni no-GET
  if (e.request.method !== 'GET') return;
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('cdnjs') ||
    url.hostname.includes('jsdelivr') ||
    url.hostname.includes('unpkg') ||
    url.hostname.includes('tailwindcss') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('lucide')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          // SPA fallback → devolver index.html
          return caches.match('./index.html');
        })
      )
  );
});

// Mensajes
self.addEventListener('message', e => {
  if (e.data?.tipo === 'SKIP_WAITING') self.skipWaiting();
});
