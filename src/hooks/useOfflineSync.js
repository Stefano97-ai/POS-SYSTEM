/**
 * useOfflineSync — Hook para detectar estado de conexión y sincronizar ventas
 * 
 * Retorna:
 *   - isOnline: boolean
 *   - pendingCount: número de ventas en cola offline
 *   - syncing: boolean (sincronizando ahora)
 *   - syncNow: función para forzar sincronización
 */

import { useState, useEffect, useCallback } from 'react';
import { getPendingSales, markSaleSynced, deleteSaleFromQueue } from '../utils/offlineDB';
import { api } from '../services/api';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // (Se movió el event listener más abajo)

  // Contar ventas pendientes
  useEffect(() => {
    const checkPending = async () => {
      const pending = await getPendingSales();
      setPendingCount(pending.length);
    };
    checkPending();
    // Re-chequear cada 30 segundos
    const interval = setInterval(checkPending, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sincronizar ventas pendientes con el backend
  const syncNow = useCallback(async () => {
    if (syncing || !navigator.onLine) return;

    const pending = await getPendingSales();
    if (pending.length === 0) return;

    setSyncing(true);
    let syncedCount = 0;

    for (const sale of pending) {
      try {
        // Intentar enviar la venta al backend
        await api.createSale(sale.data);
        await deleteSaleFromQueue(sale.id);
        syncedCount++;
      } catch (err) {
        console.warn('[OfflineSync] Error sincronizando venta:', sale.id, err.message);
        // Si el error es 4xx (datos inválidos), eliminar de la cola para evitar loop
        if (err.response?.status >= 400 && err.response?.status < 500) {
          await markSaleSynced(sale.id);
        }
        // Si es error de red, dejar para el próximo intento
      }
    }

    const remaining = await getPendingSales();
    setPendingCount(remaining.length);
    setLastSynced(new Date());
    setSyncing(false);

    if (syncedCount > 0) {
      console.log(`[OfflineSync] ${syncedCount} venta(s) sincronizada(s) exitosamente`);
    }

    return syncedCount;
  }, [syncing]);

  // Detectar cambios de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sincronizar automáticamente al recuperar conexión
      setTimeout(() => syncNow(), 1000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncNow]);

  // Registrar Service Worker y Background Sync
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        // Registrar Background Sync si está disponible
        if ('sync' in reg) {
          window._posSwRegistration = reg;
        }
      });
    }
  }, []);

  // Trigger Background Sync del SW cuando se crea una venta offline
  const requestBackgroundSync = useCallback(async () => {
    if (window._posSwRegistration?.sync) {
      try {
        await window._posSwRegistration.sync.register('sync-ventas');
      } catch (err) {
        console.warn('[OfflineSync] Background sync no disponible:', err);
      }
    }
  }, []);

  return {
    isOnline,
    pendingCount,
    syncing,
    lastSynced,
    syncNow,
    requestBackgroundSync,
  };
}
