import Modal from '../Modal';

export default function ResumenDiarioModal({ isOpen, onClose, onSubmit, processing, boletasHoy, notasHoy }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resumen Diario">
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-sec)', marginBottom: '1rem' }}>
        El Resumen Diario envía a SUNAT un consolidado de las boletas de venta y notas asociadas emitidas en el día.
        Este proceso es obligatorio para informar las boletas electrónicas.
      </p>
      <div className="nc-ref-card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Boletas del día:</span>
          <strong>{boletasHoy}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>Notas del día:</span>
          <strong>{notasHoy}</strong>
        </div>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" onClick={onSubmit} disabled={processing}>
          {processing ? 'Enviando...' : 'Enviar Resumen Diario'}
        </button>
      </div>
    </Modal>
  );
}
