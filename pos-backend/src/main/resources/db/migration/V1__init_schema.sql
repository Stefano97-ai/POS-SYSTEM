-- =====================================================
-- V1: Schema inicial - Sistema POS Importaciones Nunez
-- =====================================================

-- Tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(100),
    rol VARCHAR(20) NOT NULL DEFAULT 'ROLE_VENDEDOR',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Tabla de refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(500) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de log de auditoria
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario VARCHAR(50),
    accion VARCHAR(50) NOT NULL,
    entidad VARCHAR(50) NOT NULL,
    entidad_id VARCHAR(50),
    detalle TEXT,
    ip VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de categorias
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id UUID REFERENCES categorias(id),
    precio_compra DECIMAL(12,2) NOT NULL DEFAULT 0,
    precio_venta DECIMAL(12,2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 5,
    unidad_medida VARCHAR(20) NOT NULL DEFAULT 'UND',
    modelo VARCHAR(100),
    tamanio VARCHAR(50),
    color VARCHAR(50),
    material VARCHAR(100),
    codigo_barras VARCHAR(100),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Tabla de clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_documento VARCHAR(10) NOT NULL DEFAULT 'DNI',
    numero_documento VARCHAR(20),
    tipo_cliente VARCHAR(20) NOT NULL DEFAULT 'PERSONA',
    nombre VARCHAR(200) NOT NULL,
    razon_social VARCHAR(200),
    direccion VARCHAR(300),
    telefono VARCHAR(20),
    email VARCHAR(100),
    clasificacion VARCHAR(20) NOT NULL DEFAULT 'NUEVO',
    notas TEXT,
    total_compras DECIMAL(14,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50),
    updated_by VARCHAR(50)
);

-- Tabla de proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruc VARCHAR(20),
    nombre VARCHAR(200) NOT NULL,
    contacto VARCHAR(150),
    telefono VARCHAR(20),
    email VARCHAR(100),
    direccion VARCHAR(300),
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Relacion proveedor-producto
CREATE TABLE proveedor_producto (
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    producto_id UUID NOT NULL REFERENCES productos(id),
    PRIMARY KEY (proveedor_id, producto_id)
);

-- Tabla de series y correlativos
CREATE TABLE series_correlativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_comprobante VARCHAR(20) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    correlativo_actual INTEGER NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE(tipo_comprobante, serie)
);

-- Tabla de ventas
CREATE TABLE ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_venta VARCHAR(30) NOT NULL UNIQUE,
    cliente_id UUID REFERENCES clientes(id),
    tipo_comprobante VARCHAR(20) NOT NULL DEFAULT 'BOLETA',
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
    igv DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'EFECTIVO',
    monto_pagado DECIMAL(12,2) NOT NULL DEFAULT 0,
    vuelto DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'COMPLETADA',
    notas TEXT,
    vendedor_id UUID REFERENCES usuarios(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de detalle de ventas
CREATE TABLE detalle_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    producto_nombre VARCHAR(200) NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL
);

-- Tabla de comprobantes electronicos
CREATE TABLE comprobantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id),
    tipo_comprobante VARCHAR(20) NOT NULL,
    serie VARCHAR(10) NOT NULL,
    correlativo INTEGER NOT NULL,
    numero_completo VARCHAR(20) NOT NULL,
    cliente_tipo_doc VARCHAR(10),
    cliente_numero_doc VARCHAR(20),
    cliente_nombre VARCHAR(200),
    cliente_direccion VARCHAR(300),
    fecha_emision TIMESTAMP NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    igv DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    estado_sunat VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    hash_cdr VARCHAR(500),
    xml_contenido TEXT,
    pdf_url VARCHAR(500),
    mensaje_sunat TEXT,
    codigo_respuesta VARCHAR(10),
    comprobante_referencia_id UUID REFERENCES comprobantes(id),
    motivo_nota VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabla de movimientos de inventario (Kardex)
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    tipo_movimiento VARCHAR(20) NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_posterior INTEGER NOT NULL,
    precio_unitario DECIMAL(12,2),
    documento_referencia VARCHAR(100),
    proveedor_id UUID REFERENCES proveedores(id),
    motivo VARCHAR(300),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(50)
);

-- Tabla de configuracion de empresa
CREATE TABLE configuracion_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruc VARCHAR(20) NOT NULL,
    razon_social VARCHAR(200) NOT NULL,
    nombre_comercial VARCHAR(200),
    direccion VARCHAR(300),
    ubigeo VARCHAR(10),
    telefono VARCHAR(20),
    email VARCHAR(100),
    logo_url VARCHAR(500),
    igv_porcentaje DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    moneda VARCHAR(5) NOT NULL DEFAULT 'PEN',
    ose_provider VARCHAR(50),
    ose_api_url VARCHAR(300),
    ose_api_token VARCHAR(500),
    certificado_digital_path VARCHAR(500),
    certificado_digital_password VARCHAR(200),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_clientes_documento ON clientes(tipo_documento, numero_documento);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_ventas_fecha ON ventas(created_at);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_estado ON ventas(estado);
CREATE INDEX idx_detalle_ventas_venta ON detalle_ventas(venta_id);
CREATE INDEX idx_comprobantes_venta ON comprobantes(venta_id);
CREATE INDEX idx_comprobantes_estado ON comprobantes(estado_sunat);
CREATE INDEX idx_comprobantes_numero ON comprobantes(numero_completo);
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(created_at);
CREATE INDEX idx_audit_log_fecha ON audit_log(created_at);
CREATE INDEX idx_audit_log_usuario ON audit_log(usuario);
CREATE INDEX idx_proveedores_ruc ON proveedores(ruc);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Datos iniciales: Series y correlativos
INSERT INTO series_correlativos (id, tipo_comprobante, serie, correlativo_actual) VALUES
    (gen_random_uuid(), 'FACTURA', 'F001', 0),
    (gen_random_uuid(), 'BOLETA', 'B001', 0),
    (gen_random_uuid(), 'NOTA_CREDITO', 'FC01', 0),
    (gen_random_uuid(), 'NOTA_DEBITO', 'FD01', 0);

-- Datos iniciales: Categorias textiles
INSERT INTO categorias (id, nombre, descripcion) VALUES
    (gen_random_uuid(), 'Maletas', 'Maletas de viaje de diversos tamaños'),
    (gen_random_uuid(), 'Bolsos de Mano', 'Bolsos de mano y carteras'),
    (gen_random_uuid(), 'Mochilas Escolares', 'Mochilas para uso escolar'),
    (gen_random_uuid(), 'Bolsos Ejecutivos', 'Maletines y bolsos ejecutivos'),
    (gen_random_uuid(), 'Talabartería', 'Cinturones, correas y artículos de cuero'),
    (gen_random_uuid(), 'Máquinas Textiles', 'Máquinas de costura y corte'),
    (gen_random_uuid(), 'Repuestos', 'Repuestos para máquinas textiles');

-- Datos iniciales: Configuracion de empresa
INSERT INTO configuracion_empresa (id, ruc, razon_social, nombre_comercial, direccion, ubigeo, telefono, email, igv_porcentaje, moneda)
VALUES (
    gen_random_uuid(),
    '10095470837',
    'Nuñez Quiñonez Jesus Alberto',
    'Importaciones Nuñez',
    'Av. Tupac Amaru Nro. 306, Urb. El Progreso, Carabayllo, Lima, Peru',
    '150106',
    '991900034',
    'jesucito2443@hotmail.com',
    18.00,
    'PEN'
);

-- Datos iniciales: Cliente general (para boletas sin documento)
INSERT INTO clientes (id, tipo_documento, numero_documento, tipo_cliente, nombre, clasificacion)
VALUES (gen_random_uuid(), 'SIN_DOC', '00000000', 'PERSONA', 'Cliente General', 'FRECUENTE');

-- Datos iniciales: Clientes corporativos
INSERT INTO clientes (id, tipo_documento, numero_documento, tipo_cliente, nombre, razon_social, clasificacion)
VALUES
    (gen_random_uuid(), 'RUC', '20601234567', 'EMPRESA', 'Grupo JPL PERÚ S.A.C.', 'Grupo JPL PERÚ S.A.C.', 'CORPORATIVO'),
    (gen_random_uuid(), 'RUC', '20609876543', 'EMPRESA', 'Distribuidora El Maletín del Norte', 'Distribuidora El Maletín del Norte', 'CORPORATIVO'),
    (gen_random_uuid(), 'RUC', '20551234890', 'EMPRESA', 'I.E.P Los Andes', 'I.E.P Los Andes', 'CORPORATIVO'),
    (gen_random_uuid(), 'RUC', '20607654321', 'EMPRESA', 'CorpGifts S.A.C.', 'CorpGifts S.A.C.', 'CORPORATIVO');
