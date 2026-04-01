package com.importacionesnunez.pos.modules.reporte.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ReporteVentasDto {
    private BigDecimal totalIngresos;
    private long totalVentas;
    private BigDecimal promedioVenta;
    private BigDecimal totalDescuentos;
    private BigDecimal totalIgv;
    private List<VentaDetalleReporteDto> ventas;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VentaDetalleReporteDto {
        private String id;
        private String numeroVenta;
        private String clienteNombre;
        private String tipoComprobante;
        private String comprobanteNumero;
        private BigDecimal total;
        private String metodoPago;
        private String estado;
        private String fecha;
    }
}
