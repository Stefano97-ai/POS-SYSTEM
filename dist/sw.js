// ============================================================
// Service Worker — Importaciones Nuñez POS
// Estrategia: Cache First para assets, Network First para API
// ============================================================

const CACHE_NAME = 'pos-nunez-v1';
const OFFLINE_URL = '/offline.html';

// Archivos que se cachean al instalar el SW
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
];

// ===== INSTALL: precachear assets esenciales =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-cacheando assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ===== ACTIVATE: limpiar caches viejos =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('[SW] Eliminando cache viejo:', key);
          return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ===== FETCH: estrategia por tipo de recurso =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requests no GET y extensiones de Vite en dev
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) return;

  // API requests: Network First (si falla, error claro)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => new Response(
          JSON.stringify({ error: 'Sin conexión — datos del servidor no disponibles', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        ))
    );
    return;
  }

  // App Shell (HTML/JS/CSS): Cache First con fallback a red
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Cachear respuestas exitosas
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Si falla y es navegación, mostrar página offline
        if (request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
      });
    })
  );
});

// ===== BACKGROUND SYNC: sincronizar ventas pendientes =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ventas') {
    console.log('[SW] Background sync: sincronizando ventas pendientes...');
    event.waitUntil(syncPendingSales());
  }
});

async function syncPendingSales() {
  // Abrir IndexedDB y procesar cola de ventas
  const db = await openDB();
  const tx = db.transaction('salesQueue', 'readwrite');
  const store = tx.objectStore('salesQueue');
  const sales = await getAllFromStore(store);

  for (const sale of sales) {
    try {
      const token = await getFromStore(db, 'config', 'pos_token');
      const response = await fetch('/api/v1/ventas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify(sale.data),
      });

      if (response.ok) {
        // Eliminar de la cola si se sincronizó
        const delTx = db.transaction('salesQueue', 'readwrite');
        delTx.objectStore('salesQueue').delete(sale.id);
        console.log('[SW] Venta sincronizada:', sale.id);
      }
    } catch (err) {
      console.warn('[SW] Error sincronizando venta:', err);
    }
  }
}

// Helpers IndexedDB minimalistas para el SW
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('pos-offline-db', 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('salesQueue')) {
        db.createObjectStore('salesQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config');
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function getFromStore(db, storeName, key) {
  return new Promise((resolve) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
