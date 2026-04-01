-- =====================================================
-- V2: Facturación electrónica - campos adicionales
-- =====================================================

-- Nuevos campos en configuracion_empresa para OSE/SUNAT
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS ose_mode VARCHAR(20) NOT NULL DEFAULT 'BETA';
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS ose_usuario_sol VARCHAR(100);
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS ose_clave_sol VARCHAR(200);
ALTER TABLE configuracion_empresa ADD COLUMN IF NOT EXISTS ose_api_url_beta VARCHAR(300);

-- Nuevos campos en comprobantes para firma y CDR
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS xml_firmado TEXT;
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS cdr_contenido TEXT;
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS ticket_sunat VARCHAR(100);

-- Índice para reintento de comprobantes pendientes/error
CREATE INDEX IF NOT EXISTS idx_comprobantes_reintento
    ON comprobantes(estado_sunat) WHERE estado_sunat IN ('PENDIENTE', 'ERROR');
