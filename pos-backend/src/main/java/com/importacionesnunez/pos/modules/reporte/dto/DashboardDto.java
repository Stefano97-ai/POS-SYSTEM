package com.importacionesnunez.pos.modules.reporte.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardDto {
    private BigDecimal ventasHoy;
    private BigDecimal ventasSemana;
    private BigDecimal ventasMes;
    private long totalVentasHoy;
    private long totalVentasMes;
    private long totalClientes;
    private long totalProductos;
    private long productosStockBajo;
    private List<ProductoTopDto> productosTop;
    private List<VentaRecienteDto> ventasRecientes;
    private List<MetodoPagoResumenDto> resumenMetodosPago;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ProductoTopDto {
        private String productoNombre;
        private long cantidadVendida;
        private BigDecimal totalVentas;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class VentaRecienteDto {
        private String id;
        private String numeroVenta;
        private String clienteNombre;
        private BigDecimal total;
        private String metodoPago;
        private String estado;
        private String createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MetodoPagoResumenDto {
        private String metodoPago;
        private long cantidad;
        private BigDecimal total;
    }
}
