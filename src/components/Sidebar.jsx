import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FileText,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Warehouse,
  Truck,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { path: '/products', label: 'Productos', icon: Package },
  { path: '/inventory', label: 'Inventario', icon: Warehouse },
  { path: '/billing', label: 'Facturación', icon: FileText },
  { path: '/customers', label: 'Clientes', icon: Users },
  { path: '/suppliers', label: 'Proveedores', icon: Truck },
  { path: '/reports', label: 'Reportes', icon: BarChart3 },
  { path: '/settings', label: 'Configuración', icon: Settings },
];

export default function Sidebar({ onLogout, isOpen, onClose }) {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem('pos_user')) || {};
    } catch {
      return {};
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('pos_token');
    localStorage.removeItem('pos_user');
    onLogout?.();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}>
      {/* Botón cerrar en móvil */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú">
        <X size={20} />
      </button>

      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">POS</div>
          <span className="sidebar-title">Importaciones Nuñez</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            end={item.path === '/'}
            onClick={onClose}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}

      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {(user.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {user.username || 'Usuario'}
            </span>
            <span className="sidebar-user-role">Administrador</span>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', marginLeft: 'auto', padding: '5px' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
