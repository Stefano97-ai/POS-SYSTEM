import { Truck, Edit2 } from 'lucide-react';
import Modal from '../Modal';
import { formatCurrency, getStockLevel } from '../../utils/helpers';

export default function SupplierDetailModal({ supplier, supplierProducts, currency, onClose, onEdit }) {
  if (!supplier) return null;
  return (
    <Modal isOpen={!!supplier} onClose={onClose} title="Detalle del Proveedor" size="lg">
      <div className="supplier-detail-banner">
        <div className="supplier-avatar" style={{ width: '48px', height: '48px' }}><Truck size={24} /></div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{supplier.nombre}</h3>
          {supplier.ruc && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>RUC: {supplier.ruc}</span>}
          {supplier.razonSocial && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-sec)' }}>{supplier.razonSocial}</span>}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}><Edit2 size={14} /> Editar</button>
      </div>

      <div className="supplier-detail-section">
        <h4>Información de contacto</h4>
        <div className="expanded-info-list">
          {supplier.telefono && <div className="expanded-info-row"><span>Teléfono:</span><span>{supplier.telefono}</span></div>}
          {(supplier.correo || supplier.email) && <div className="expanded-info-row"><span>Email:</span><span>{supplier.correo || supplier.email}</span></div>}
          {supplier.direccion && <div className="expanded-info-row"><span>Dirección:</span><span>{supplier.direccion}</span></div>}
          {supplier.sitioWeb && <div className="expanded-info-row"><span>Web:</span><span>{supplier.sitioWeb}</span></div>}
          {supplier.contactoNombre && (
            <div className="expanded-info-row">
              <span>Contacto:</span>
              <span>{supplier.contactoNombre}{supplier.contactoCargo ? ` (${supplier.contactoCargo})` : ''}</span>
            </div>
          )}
        </div>
      </div>

      {supplier.notas && (
        <div className="supplier-detail-section">
          <h4>Notas</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sec)', margin: 0 }}>{supplier.notas}</p>
        </div>
      )}

      <div className="supplier-detail-section">
        <h4>Productos asociados ({supplierProducts.length})</h4>
        {supplierProducts.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>Producto</th><th>Código</th><th>Stock</th><th>P. Venta</th></tr>
              </thead>
              <tbody>
                {supplierProducts.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td className="text-muted">{p.barcode || '-'}</td>
                    <td><span className={`stock-badge ${getStockLevel(p)}`}>{p.stock || 0}</span></td>
                    <td className="text-accent">{formatCurrency(p.price, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: '0.5rem 0' }}>No hay productos asociados a este proveedor</p>
        )}
      </div>
    </Modal>
  );
}
