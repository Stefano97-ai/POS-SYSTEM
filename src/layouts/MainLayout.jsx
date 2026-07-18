import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/pos': 'Punto de Venta',
  '/products': 'Productos',
  '/inventory': 'Inventario',
  '/billing': 'Facturación',
  '/customers': 'Clientes',
  '/suppliers': 'Proveedores',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
};

export default function MainLayout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'POS';

  return (
    <div className="app-layout">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main-content">
        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <span className="mobile-page-title">{pageTitle}</span>
          <div style={{ width: 40 }} />
        </div>

        <Outlet />
      </main>
    </div>
  );
}
