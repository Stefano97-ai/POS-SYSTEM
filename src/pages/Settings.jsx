import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { Save, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import EmpresaCard from '../components/settings/EmpresaCard';
import SeriesCard from '../components/settings/SeriesCard';
import ImpuestosCard from '../components/settings/ImpuestosCard';
import OseCard from '../components/settings/OseCard';
import CertificadoCard from '../components/settings/CertificadoCard';
import ImpresoraCard from '../components/settings/ImpresoraCard';

export default function Settings() {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ ...state.settings });
  const [loading, setLoading] = useState(false);
  const { toast, showToast } = useToast();

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setForm({ ...state.settings }); }, [state.settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      if (form.certFile) {
        try {
          await api.subirCertificado(form.certFile, form.certPassword);
          showToast('Certificado subido correctamente');
        } catch {
          showToast('Error al subir el certificado: Verifica la contraseña', 'error');
          setLoading(false);
          return;
        }
      }
      // Guardar en backend
      try {
        await api.updateSettings(form);
      } catch (backendErr) {
        const msg = backendErr?.response?.data?.message || backendErr?.message || 'Error desconocido';
        console.error('Error al guardar configuración en backend:', backendErr);
        showToast(`Error al guardar en el servidor: ${msg}`, 'error');
        setLoading(false);
        return;
      }
      // Si habia certificado pendiente, marcarlo como guardado
      const finalForm = { ...form };
      if (form.certFile) {
        finalForm.certFileName = form.certFile.name;
        finalForm.certFile = null; // limpiar pendiente
      }
      // Siempre actualizar el estado local con lo que el usuario escribio
      dispatch({ type: 'UPDATE_SETTINGS', payload: finalForm });
      showToast('Configuracion guardada exitosamente');
    } catch {
      showToast('Error al guardar configuracion', 'error');
    }
    setLoading(false);
  };

  const handleReset = () => {
    if (!window.confirm('¿Restaurar toda la configuración a valores de fábrica? Esta acción no se puede deshacer.')) return;
    dispatch({ type: 'RESET_DATA' });
    setForm({ ...state.settings });
    showToast('Datos restaurados');
  };

  const handleClearData = async () => {
    if (!window.confirm('¡ZONA DE PELIGRO!\n¿Estás seguro que deseas eliminar TODOS tus productos y vaciar el historial de ventas? Esta acción borrará los datos permanentemente.')) return;
    
    setLoading(true);
    showToast('Iniciando borrado de datos. Por favor espera...');
    
    try {
      let errors = [];
      // 1. Borrar todas las ventas PRIMERO (para liberar llaves foráneas)
      const sales = [...state.sales];
      let deletedSales = 0;
      for (const s of sales) {
        try {
          await api.deleteVenta(s.id);
          deletedSales++;
        } catch (e) {
          errors.push(`Venta ${s.id}: ${e.response?.data?.message || e.message}`);
        }
      }

      // 2. Borrar todos los productos
      const prods = [...state.products];
      let deletedProds = 0;
      for (const p of prods) {
        try {
          await api.deleteProduct(p.id);
          deletedProds++;
        } catch (e) {
          errors.push(`Producto ${p.id}: ${e.response?.data?.message || e.message}`);
        }
      }
      
      if (errors.length > 0) {
        alert(`Ocurrieron errores al intentar borrar en la base de datos:\n\n${errors.slice(0, 5).join('\n')}\n\nEs probable que el servidor backend no permita borrar ventas por reglas de auditoría. Ventas borradas: ${deletedSales}. Productos borrados: ${deletedProds}.`);
      } else {
        showToast(`Limpieza completada: ${deletedSales} ventas y ${deletedProds} productos eliminados.`, 'success');
      }

      dispatch({ type: 'RESET_DATA' });
      setTimeout(() => window.location.reload(), 2000);
    } catch {
      showToast('Ocurrió un error general al limpiar los datos.', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="data-page-premium">
      <div className="page-header-premium">
        <div className="title-area">
          <h1>Configuración</h1>
          <p>Empresa, facturación electrónica, series y conexión OSE</p>
        </div>
        <button className="btn btn-primary" style={{ padding: '0.75rem 1.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)' }} onClick={handleSave} disabled={loading}>
          <Save size={18} /> {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      <div className="settings-grid">
        <div className="settings-column">
          <EmpresaCard form={form} setForm={setForm} />
          <SeriesCard showToast={showToast} />
          <ImpuestosCard form={form} setForm={setForm} />
        </div>
        <div className="settings-column">
          <OseCard form={form} setForm={setForm} />
          <CertificadoCard form={form} setForm={setForm} showToast={showToast} />
          <ImpresoraCard form={form} setForm={setForm} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
        <button className="btn btn-ghost" onClick={handleReset} style={{ color: 'var(--color-text-muted)' }}>
          <RotateCcw size={16} /> Restaurar Ajustes
        </button>
        <button className="btn btn-danger" onClick={handleClearData} disabled={loading} style={{ background: '#EF4444', color: 'white', borderRadius: '0.75rem', padding: '0.75rem 1.25rem', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.3)' }}>
          <AlertTriangle size={18} /> {loading ? 'Borrando...' : 'Borrar Productos y Ventas'}
        </button>
      </div>

      {toast && (
        <div className={`billing-toast ${toast.type === 'error' ? 'billing-toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
