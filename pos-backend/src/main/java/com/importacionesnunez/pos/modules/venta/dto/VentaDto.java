package com.importacionesnunez.pos.modules.venta.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class VentaDto {
    private String id;
    private String numeroVenta;
    private String clienteId;
    private String clienteNombre;
    private String clienteDocumento;
    private String tipoComprobante;
    private BigDecimal subtotal;
    private BigDecimal descuento;
    private BigDecimal igv;
    private BigDecimal total;
    private String metodoPago;
    private BigDecimal montoPagado;
    private BigDecimal vuelto;
    private String estado;
    private String notas;
    private String vendedorNombre;
    private List<DetalleVentaDto> detalles;
    private String comprobanteNumero;
    private String comprobanteId;
    private String comprobanteEstado;
    private LocalDateTime createdAt;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DetalleVentaDto {
        private String id;
        private String productoId;
        private String productoNombre;
        private int cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal descuento;
        private BigDecimal subtotal;
    }
}
