import { Mail, Phone, Edit, Trash2, Building2, User } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const CLASIFICACION_COLORS = { NUEVO: 'neutral', FRECUENTE: 'success', CORPORATIVO: 'warning' };

export default function CustomerCard({ customer, currency, onEdit, onDelete }) {
  const isEmpresa = customer.tipoCliente === 'EMPRESA';
  const isGeneral = customer.name === 'Cliente General' || customer.nombre === 'Cliente General';

  return (
    <div className="data-card-premium" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--color-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1 }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '0.75rem', background: isEmpresa ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: isEmpresa ? '#D97706' : '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isEmpresa ? <Building2 size={20} /> : <User size={20} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-main)', lineHeight: '1.2' }}>{customer.name || customer.nombre}</h3>
            {customer.razonSocial && customer.razonSocial !== customer.name && (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{customer.razonSocial}</span>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
              {customer.tipoDocumento && customer.tipoDocumento !== 'SIN_DOC' && (
                <span className="badge-premium neutral" style={{ fontSize: '0.65rem' }}>
                  {customer.tipoDocumento}: {customer.numeroDocumento}
                </span>
              )}
              {customer.clasificacion && (
                <span className={`badge-premium ${CLASIFICACION_COLORS[customer.clasificacion] || 'neutral'}`} style={{ fontSize: '0.65rem' }}>
                  {customer.clasificacion}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="action-cell" style={{ flexShrink: 0 }}>
          <button className="btn-action-premium edit" onClick={onEdit} title="Editar"><Edit size={16} /></button>
          {!isGeneral && <button className="btn-action-premium delete" onClick={onDelete} title="Eliminar"><Trash2 size={16} /></button>}
        </div>
      </div>
      
      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' }}>
        {customer.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Mail size={14} /><span>{customer.email}</span></div>}
        {(customer.phone || customer.telefono) && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Phone size={14} /><span>{customer.phone || customer.telefono}</span></div>}
      </div>
      
      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>Total compras:</span>
        <span className="cell-currency">{formatCurrency(customer.totalPurchases || customer.totalCompras || 0, currency)}</span>
      </div>
    </div>
  );
}
