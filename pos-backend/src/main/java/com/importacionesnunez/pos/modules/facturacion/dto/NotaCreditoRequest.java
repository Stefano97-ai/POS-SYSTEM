package com.importacionesnunez.pos.modules.facturacion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotaCreditoRequest {
    @NotBlank(message = "El ID de venta es obligatorio")
    private String ventaId;

    @NotBlank(message = "El motivo es obligatorio")
    private String motivo;
}
