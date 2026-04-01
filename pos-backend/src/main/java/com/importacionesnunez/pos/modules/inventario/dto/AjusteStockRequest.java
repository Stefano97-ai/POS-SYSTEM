package com.importacionesnunez.pos.modules.inventario.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AjusteStockRequest {
    @NotBlank(message = "El producto es obligatorio")
    private String productoId;

    private int cantidad; // positivo = agregar, negativo = quitar

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;
}
