package com.importacionesnunez.pos.modules.inventario.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class EntradaStockRequest {
    @NotBlank(message = "El producto es obligatorio")
    private String productoId;

    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private int cantidad;

    private BigDecimal precioUnitario;
    private String proveedorId;
    private String documentoReferencia;
    private String motivo;
}
