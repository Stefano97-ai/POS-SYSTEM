import { useState, useEffect } from 'react';
import Modal from '../Modal';

const EMPTY_FORM = { nombre: '', ruc: '', razonSocial: '', correo: '', telefono: '', direccion: '', sitioWeb: '', contactoNombre: '', contactoCargo: '', notas: '' };

export default function SupplierFormModal({ isOpen, onClose, onSubmit, processing, editingSupplier }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const set = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (editingSupplier) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        nombre: editingSupplier.nombre || '',
        ruc: editingSupplier.ruc || '',
        razonSocial: editingSupplier.razonSocial || '',
        correo: editingSupplier.correo || editingSupplier.email || '',
        telefono: editingSupplier.telefono || '',
        direccion: editingSupplier.direccion || '',
        sitioWeb: editingSupplier.sitioWeb || '',
        contactoNombre: editingSupplier.contactoNombre || '',
        contactoCargo: editingSupplier.contactoCargo || '',
        notas: editingSupplier.notas || '',
      });
    } else {
      setFormData(EMPTY_FORM);
    }
  }, [editingSupplier, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Nombre / Empresa *</label>
            <input type="text" required value={formData.nombre} onChange={(e) => set('nombre', e.target.value)} placeholder="Ej: Inversiones Globales S.A.C." />
          </div>
          <div className="form-group">
            <label>RUC</label>
            <input type="text" value={formData.ruc} onChange={(e) => set('ruc', e.target.value)} placeholder="20123456789" maxLength={11} />
          </div>
        </div>

        <div className="form-group">
          <label>Razón Social</label>
          <input type="text" value={formData.razonSocial} onChange={(e) => set('razonSocial', e.target.value)} placeholder="Razón social completa (si es diferente al nombre)" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Teléfono</label>
            <input type="text" value={formData.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="987 654 321" />
          </div>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input type="email" value={formData.correo} onChange={(e) => set('correo', e.target.value)} placeholder="contacto@proveedor.com" />
          </div>
        </div>

        <div className="form-group">
          <label>Dirección</label>
          <input type="text" value={formData.direccion} onChange={(e) => set('direccion', e.target.value)} placeholder="Av. Las Magnolias 123, Lima" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Persona de Contacto</label>
            <input type="text" value={formData.contactoNombre} onChange={(e) => set('contactoNombre', e.target.value)} placeholder="Nombre del contacto" />
          </div>
          <div className="form-group">
            <label>Cargo</label>
            <input type="text" value={formData.contactoCargo} onChange={(e) => set('contactoCargo', e.target.value)} placeholder="Ej: Gerente de Ventas" />
          </div>
        </div>

        <div className="form-group">
          <label>Sitio Web</label>
          <input type="text" value={formData.sitioWeb} onChange={(e) => set('sitioWeb', e.target.value)} placeholder="www.proveedor.com" />
        </div>

        <div className="form-group">
          <label>Notas</label>
          <textarea value={formData.notas} onChange={(e) => set('notas', e.target.value)} placeholder="Observaciones, condiciones de pago, días de entrega..." rows={2} style={{ width: '100%', resize: 'vertical' }} />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={processing || !formData.nombre.trim()}>
            {processing ? 'Guardando...' : editingSupplier ? 'Actualizar' : 'Registrar Proveedor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
