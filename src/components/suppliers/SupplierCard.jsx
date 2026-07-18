import { Truck, Phone, Mail, MapPin, Globe, Package, Edit2, Trash2 } from 'lucide-react';

export default function SupplierCard({ supplier: s, productCount, onEdit, onDelete, onClick }) {
  return (
    <div className="supplier-card" onClick={onClick}>
      <div className="supplier-card-header">
        <div className="supplier-avatar"><Truck size={20} /></div>
        <div className="supplier-card-info">
          <h3>{s.nombre}</h3>
          {s.ruc && <span className="supplier-ruc">RUC: {s.ruc}</span>}
          {s.razonSocial && s.razonSocial !== s.nombre && <span className="supplier-razon">{s.razonSocial}</span>}
        </div>
        <div className="supplier-card-actions">
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Editar">
            <Edit2 size={14} />
          </button>
          <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Eliminar" style={{ color: 'var(--color-danger)' }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="supplier-card-details">
        {s.telefono && <div className="supplier-detail-row"><Phone size={13} /> <span>{s.telefono}</span></div>}
        {(s.correo || s.email) && <div className="supplier-detail-row"><Mail size={13} /> <span>{s.correo || s.email}</span></div>}
        {s.direccion && <div className="supplier-detail-row"><MapPin size={13} /> <span>{s.direccion}</span></div>}
      </div>

      <div className="supplier-card-footer">
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <Package size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> {productCount} producto{productCount !== 1 ? 's' : ''} asociado{productCount !== 1 ? 's' : ''}
        </span>
        {s.sitioWeb && (
          <a
            href={s.sitioWeb.startsWith('http') ? s.sitioWeb : `https://${s.sitioWeb}`}
            target="_blank" rel="noopener noreferrer"
            className="supplier-web-link"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe size={12} /> Web
          </a>
        )}
      </div>
    </div>
  );
}
