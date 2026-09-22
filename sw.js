// HospedaYa Service Worker — Auto-actualización v1
// Cambia este número cada vez que hagas deploy para forzar update
const CACHE_VERSION = 'hospedaya-v1';
const CACHE_STATIC  = 'hospedaya-static-v1';

// Archivos que se cachean en la instalación
const ARCHIVOS_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/facturacionSunat.js',
  '/config.js',
  '/supabaseClient.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// ── INSTALACIÓN: pre-cachear archivos estáticos ──────────────
self.addEventListener('install', e => {
  console.log('[SW] Instalando versión:', CACHE_VERSION);
  e.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(ARCHIVOS_CACHE).catch(err => {
        console.warn('[SW] Error cacheando algunos archivos:', err);
      });
    }).then(() => {
      // ⭐ CLAVE: activar inmediatamente sin esperar que el tab se cierre
      return self.skipWaiting();
    })
  );
});

// ── ACTIVACIÓN: limpiar cachés viejos y tomar control ────────
self.addEventListener('activate', e => {
  console.log('[SW] Activando versión:', CACHE_VERSION);
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_STATIC && key !== CACHE_VERSION)
          .map(key => {
            console.log('[SW] Eliminando caché viejo:', key);
            return caches.delete(key);
          })
      )
    ).then(() => {
      // ⭐ CLAVE: tomar control de TODOS los tabs abiertos inmediatamente
      return self.clients.claim();
    }).then(() => {
      // Notificar a todos los tabs que hay una nueva versión
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ tipo: 'SW_ACTUALIZADO', version: CACHE_VERSION });
        });
      });
    })
  );
});

// ── FETCH: Network First con fallback a caché ────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // No interceptar requests a Supabase ni a otros servicios externos
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('unpkg.com') ||
    url.hostname.includes('tailwindcss.com') ||
    e.request.method !== 'GET'
  ) {
    return; // Dejar pasar sin interceptar
  }

  e.respondWith(
    // Estrategia: Network First → si falla → Caché
    fetch(e.request)
      .then(response => {
        // Si la respuesta es válida, guardarla en caché
        if (response && response.status === 200 && response.type === 'basic') {
          const clon = response.clone();
          caches.open(CACHE_STATIC).then(cache => {
            cache.put(e.request, clon);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red → usar caché
        return caches.match(e.request).then(cached => {
          if (cached) return cached;
          // Si no hay caché, devolver index.html para SPA
          if (e.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// ── Escuchar mensajes del cliente ────────────────────────────
self.addEventListener('message', e => {
  if (e.data && e.data.tipo === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
