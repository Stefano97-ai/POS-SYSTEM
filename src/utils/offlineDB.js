/**
 * offlineDB.js — Wrapper de IndexedDB para el modo offline del POS
 * 
 * Stores:
 *   - products    → catálogo de productos cacheado
 *   - salesQueue  → ventas pendientes de sincronizar
 *   - config      → token y configuración
 */

const DB_NAME = 'pos-offline-db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('salesQueue')) {
        const store = db.createObjectStore('salesQueue', { keyPath: 'id' });
        store.createIndex('synced', 'synced', { unique: false });
      }
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config');
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ===== PRODUCTOS =====

export async function cacheProducts(products) {
  const db = await openDB();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');
  store.clear();
  products.forEach((p) => store.put(p));
  return tx.complete;
}

export async function getCachedProducts() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const req = tx.objectStore('products').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ===== COLA DE VENTAS OFFLINE =====

export async function queueSale(saleData) {
  const db = await openDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const entry = {
    id,
    data: saleData,
    synced: false,
    createdAt: new Date().toISOString(),
  };
  const tx = db.transaction('salesQueue', 'readwrite');
  tx.objectStore('salesQueue').add(entry);
  return entry;
}

export async function getPendingSales() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('salesQueue', 'readonly');
    const req = tx.objectStore('salesQueue').getAll();
    req.onsuccess = () => resolve((req.result || []).filter((s) => !s.synced));
    req.onerror = () => reject(req.error);
  });
}

export async function markSaleSynced(id) {
  const db = await openDB();
  const tx = db.transaction('salesQueue', 'readwrite');
  const store = tx.objectStore('salesQueue');
  return new Promise((resolve, reject) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (record) {
        record.synced = true;
        store.put(record);
      }
      resolve();
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteSaleFromQueue(id) {
  const db = await openDB();
  const tx = db.transaction('salesQueue', 'readwrite');
  tx.objectStore('salesQueue').delete(id);
}

// ===== CONFIG (token, etc.) =====

export async function saveConfig(key, value) {
  const db = await openDB();
  const tx = db.transaction('config', 'readwrite');
  tx.objectStore('config').put(value, key);
}

export async function getConfig(key) {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction('config', 'readonly');
    const req = tx.objectStore('config').get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
