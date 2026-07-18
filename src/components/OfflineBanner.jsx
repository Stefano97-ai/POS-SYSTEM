/**
 * OfflineBanner — Indicador de estado de conexión en la parte superior de la app
 * 
 * Muestra:
 *  - Banda roja cuando está offline con contador de ventas pendientes
 *  - Banda verde temporalmente al reconectar
 *  - Botón para sincronizar manualmente
 */

import { useState, useEffect } from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { Wifi, WifiOff, RefreshCw, CheckCircle } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, pendingCount, syncing, lastSynced, syncNow } = useOfflineSync();
  const [showReconnected, setShowReconnected] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  // Mostrar mensaje de "Reconectado" brevemente
  useEffect(() => {
    if (!prevOnline && isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      setPrevOnline(true);
      return () => clearTimeout(timer);
    }
    setPrevOnline(isOnline);
  }, [isOnline]);

  // No mostrar nada si está online y no hay pendientes ni mensaje de reconexión
  if (isOnline && !showReconnected && pendingCount === 0) return null;

  // Mensaje de reconexión exitosa
  if (isOnline && showReconnected) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#2d6a4f', color: 'white',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.85rem', fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        animation: 'slideDown 0.3s ease',
      }}>
        <CheckCircle size={16} />
        ✅ Conexión restablecida
        {pendingCount > 0 && (
          <span style={{ marginLeft: 'auto', opacity: 0.9 }}>
            {syncing ? '⏳ Sincronizando...' : `${pendingCount} venta(s) pendiente(s) de sincronizar`}
          </span>
        )}
      </div>
    );
  }

  // Ventas pendientes online (ya reconectó, aún sincronizando)
  if (isOnline && pendingCount > 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
        background: '#b45309', color: 'white',
        padding: '6px 16px',
        display: 'flex', alignItems: 'center', gap: '8px',
        fontSize: '0.82rem', fontWeight: 500,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
        {syncing
          ? 'Sincronizando ventas offline...'
          : `${pendingCount} venta(s) offline pendiente(s)`
        }
        {!syncing && (
          <button
            onClick={syncNow}
            style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
              border: 'none', color: 'white', padding: '3px 10px',
              borderRadius: '4px', cursor: 'pointer', fontSize: '0.78rem',
            }}
          >
            Sincronizar ahora
          </button>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // OFFLINE
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: '#7f1d1d', color: 'white',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '0.85rem', fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      animation: 'slideDown 0.3s ease',
    }}>
      <WifiOff size={16} />
      <span>Sin conexión — modo offline</span>
      {pendingCount > 0 && (
        <span style={{
          background: 'rgba(255,255,255,0.2)',
          padding: '2px 8px', borderRadius: '12px',
          fontSize: '0.78rem',
        }}>
          {pendingCount} venta(s) guardada(s) localmente
        </span>
      )}
      <span style={{ marginLeft: 'auto', opacity: 0.7, fontSize: '0.75rem' }}>
        Se sincronizará al recuperar internet
      </span>
      <style>{`
        @keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
      `}</style>
    </div>
  );
}
