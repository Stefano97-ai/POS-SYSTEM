import { ArrowUpRight, ArrowDownLeft, ArrowRightLeft, History, Package, Plus, RefreshCw, Settings2, Minus, Edit2, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// Java LocalDateTime se serializa como array [año, mes, día, hora, min, seg, nano]
// Esta función maneja ambos formatos: array de Java e ISO string
function formatMovDate(raw) {
  if (!raw) return '—';
  let date;
  if (Array.isArray(raw)) {
    // [2026, 4, 26, 10, 30, 0, 0] → meses en Java son 1-12 (ya correctos para Date)
    const [y, mo, d, h = 0, min = 0, s = 0] = raw;
    date = new Date(y, mo - 1, d, h, min, s); // mo-1 porque JS es 0-indexed
  } else {
    date = new Date(raw);
  }
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}


export default function KardexPanel({ 
  selectedProduct, kardex, loadingKardex, currency, 
  onRefresh, onEntrada, onSalida, onAjuste, onEdit, onDelete 
}) {
  if (!selectedProduct) return null;

  return (
    <>
      <div className="inv-product-banner">
        <div className="inv-product-banner-icon">
          <Package size={28} />
        </div>
        <div className="inv-product-banner-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-accent)' }}>{selectedProduct.name}</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-ghost btn-sm" onClick={onEdit} title="Editar Producto">
                <Edit2 size={14} />
              </button>
              <button className="btn btn-ghost btn-sm btn-danger-hover" onClick={onDelete} title="Eliminar Producto">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="inv-product-banner-meta">
            <div className="meta-group">
              <span>SKU: <strong>{selectedProduct.codigo || selectedProduct.barcode || 'N/A'}</strong></span>
              <span>Categoría: <strong>{selectedProduct.category || '-'}</strong></span>
              {selectedProduct.modelo && <span>Modelo: <strong>{selectedProduct.modelo}</strong></span>}
            </div>
            {/* CAMBIO N°4: Margen unitario y porcentaje con colores */}
            <div className="meta-group" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <span>Costo: <strong style={{ color: 'var(--color-warning)' }}>{formatCurrency(selectedProduct.costPrice, currency)}</strong></span>
              <span>Venta: <strong style={{ color: 'var(--color-success)' }}>{formatCurrency(selectedProduct.price, currency)}</strong></span>
              <span>Stock Mín: <strong>{selectedProduct.stockMinimo || 5}</strong></span>
            </div>
          </div>
        </div>
        <div className="inv-product-banner-stock">
          <span className="inv-stock-number" style={{ color: (selectedProduct.stock || 0) === 0 ? 'var(--color-danger)' : undefined }}>
            {selectedProduct.stock || 0}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>UNIDADES</span>
        </div>
      </div>

      {/* CAMBIO N°6: Desglosar botones de acción */}
      <div className="inv-actions-bar" style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
        <button className="btn btn-success btn-sm flex-1" onClick={onEntrada} style={{ background: '#27AE60' }}>
          <Plus size={14} /> Entrada
        </button>
        <button className="btn btn-danger btn-sm flex-1" onClick={onSalida} style={{ background: '#E74C3C' }}>
          <Minus size={14} /> Salida
        </button>
        <button className="btn btn-warning btn-sm flex-1" onClick={onAjuste} style={{ background: '#F39C12', color: 'white' }}>
          <Settings2 size={14} /> Ajuste Físico
        </button>
      </div>

      <div className="table-container" style={{ marginTop: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="inv-kardex-header">
          <h3 style={{ margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} style={{ color: 'var(--color-accent)' }} />
            Kardex — Movimientos
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={onRefresh} disabled={loadingKardex}>
            <RefreshCw size={14} className={loadingKardex ? 'spinning' : ''} /> Actualizar
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingKardex ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <RefreshCw size={24} className="spinning" />
              <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>Cargando movimientos...</p>
            </div>
          ) : (
            <table className="kardex-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Detalle / Motivo</th>
                  <th style={{ textAlign: 'right' }}>Cant.</th>
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {kardex.length > 0 ? (
                  kardex.map((mov, idx) => {
                    const tipo = mov.tipoMovimiento || mov.tipo || 'AJUSTE';
                    return (
                      <tr key={idx}>
                        <td className="text-muted" style={{ fontSize: '0.75rem' }}>{formatMovDate(mov.createdAt || mov.fechaEmision || mov.fecha)}</td>
                        <td>
                          <span className={`mov-badge mov-${tipo.toLowerCase()}`}>
                            {tipo === 'ENTRADA' ? <ArrowDownLeft size={10} /> :
                             tipo === 'SALIDA' ? <ArrowUpRight size={10} /> :
                             <ArrowRightLeft size={10} />}
                            {tipo}
                          </span>
                        </td>
                        <td>
                          <div style={{ maxWidth: '200px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block' }}>{mov.motivo || '-'}</span>
                            {mov.documentoReferencia && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {mov.documentoReferencia}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          <span style={{ color: tipo === 'ENTRADA' ? 'var(--color-success)' : tipo === 'SALIDA' ? 'var(--color-danger)' : 'var(--color-warning)' }}>
                            {tipo === 'SALIDA' ? '-' : '+'}{mov.cantidad}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }} className="text-accent">{mov.stockPosterior ?? mov.saldoPosterior ?? '-'}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                      No hay movimientos registrados
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style jsx>{`
        .meta-group { display: flex; flex-wrap: wrap; gap: 12px; font-size: 0.75rem; }
        .btn-danger-hover:hover { color: var(--color-danger) !important; background: rgba(231, 76, 60, 0.1) !important; }
        .mov-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; display: inline-flex; alignItems: center; gap: 4px; font-weight: 600; }
        .mov-entrada { background: rgba(39, 174, 96, 0.1); color: #27AE60; }
        .mov-salida { background: rgba(231, 76, 60, 0.1); color: #E74C3C; }
        .mov-ajuste { background: rgba(243, 156, 18, 0.1); color: #F39C12; }
        .kardex-table th { font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
      `}</style>
    </>
  );
}
