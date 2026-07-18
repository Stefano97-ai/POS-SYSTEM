import { Search, Filter, RotateCcw } from 'lucide-react';

const TIPO_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'BOLETA', label: 'Boleta' },
  { value: 'FACTURA', label: 'Factura' },
  { value: 'NOTA_CREDITO', label: 'Nota de Crédito' },
  { value: 'NOTA_DEBITO', label: 'Nota de Débito' },
  { value: 'NOTA_VENTA', label: 'Nota de Venta' },
];

const ESTADO_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'ACEPTADO', label: 'Aceptado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'ANULADO', label: 'Anulado' },
];

export default function BillingFilters({
  search, onSearch,
  showFilters, onToggleFilters,
  tipoFilter, onTipoFilter,
  estadoFilter, onEstadoFilter,
  fechaDesde, onFechaDesde,
  fechaHasta, onFechaHasta,
  onClear,
}) {
  const hasActiveFilters = tipoFilter || estadoFilter || fechaDesde || fechaHasta;
  const activeCount = [tipoFilter, estadoFilter, fechaDesde, fechaHasta].filter(Boolean).length;

  return (
    <>
      <div className="toolbar-premium">
        <div className="search-bar">
          <Search size={18} color="var(--color-text-muted)" />
          <input
            type="text"
            placeholder="Buscar por N° comprobante o cliente..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button
          className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '0.6rem 1.25rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={onToggleFilters}
        >
          <Filter size={16} /> Filtros
          {hasActiveFilters && <span className="filter-count" style={{ background: 'white', color: 'var(--color-primary)', padding: '2px 6px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 'bold' }}>{activeCount}</span>}
        </button>
      </div>

      {showFilters && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.25rem 1.5rem', background: 'rgba(249, 250, 251, 0.3)', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Tipo de comprobante</label>
            <select value={tipoFilter} onChange={(e) => onTipoFilter(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none' }}>
              {TIPO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Estado SUNAT</label>
            <select value={estadoFilter} onChange={(e) => onEstadoFilter(e.target.value)} style={{ padding: '0.6rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none' }}>
              {ESTADO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => onFechaDesde(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => onFechaHasta(e.target.value)} style={{ padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid var(--color-border)', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={onClear} style={{ width: '100%', padding: '0.6rem', borderRadius: '0.75rem' }}>
                <RotateCcw size={16} /> Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
