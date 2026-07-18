import { useRef, useState } from 'react';
import { CheckCircle, Printer, Mail, FileDown } from 'lucide-react';
import Modal from '../Modal';
import InvoicePreview from '../InvoicePreview';
import { useReactToPrint } from 'react-to-print';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function PostSaleModal({ isOpen, onClose, sale }) {
  const comprobanteRef = useRef();
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Hook robusto con react-to-print
  const handlePrint = useReactToPrint({
    contentRef: comprobanteRef,
    documentTitle: sale ? `Comprobante_${sale.invoiceNumber}` : 'Comprobante',
  });

  // Generador de PDF manual y exacto usando canvas con scrollHeight completo
  const handleDownloadPdf = async () => {
    if (!comprobanteRef.current || !sale) return;
    
    try {
      setGeneratingPdf(true);
      const element = comprobanteRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2, // Alta calidad
        windowHeight: element.scrollHeight, // Asegura captura vertical completa
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Ajuste automático de jsPDF usando dimensiones del canvas en pixels
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${sale.invoiceNumber || 'Comprobante'}.pdf`);
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Hubo un error al generar el PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (!sale) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Venta Completada" size="full">
      
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '12px' }}>
        <CheckCircle size={36} style={{ color: 'var(--color-success)', margin: '0 auto' }} />
        <h3 style={{ margin: '8px 0 4px', color: 'var(--color-success)' }}>¡Venta registrada exitosamente!</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', margin: 0 }}>
          {sale.invoiceNumber}
        </p>
      </div>

      {/* Contenedor principal para captura con ref */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div 
          ref={comprobanteRef} 
          style={{ width: '100%', maxWidth: '800px', background: 'white', padding: '20px' }}
        >
          <InvoicePreview sale={sale} />
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => handlePrint()}>
          <Printer size={16} /> Imprimir
        </button>
        
        <button className="btn btn-ghost" onClick={handleDownloadPdf} disabled={generatingPdf}>
          <FileDown size={16} /> {generatingPdf ? 'Generando PDF...' : 'Descargar PDF'}
        </button>

        {sale.customer?.email && (
          <button className="btn btn-ghost" onClick={() => alert('Envío por email se implementará con el módulo de facturación electrónica')}>
            <Mail size={16} /> Enviar por Email
          </button>
        )}
        
        <button className="btn btn-success" onClick={onClose}>
          Nueva Venta
        </button>
      </div>
    </Modal>
  );
}
