package com.importacionesnunez.pos.modules.inventario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MovimientoDto {
    private String id;
    private String productoId;
    private String productoNombre;
    private String tipoMovimiento;
    private int cantidad;
    private int stockAnterior;
    private int stockPosterior;
    private BigDecimal precioUnitario;
    private String documentoReferencia;
    private String proveedorNombre;
    private String motivo;
    private LocalDateTime createdAt;
    private String createdBy;
}
