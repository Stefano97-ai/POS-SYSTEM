package com.importacionesnunez.pos.modules.venta.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateVentaRequest {
    private String clienteId;

    @NotBlank(message = "El tipo de comprobante es obligatorio")
    private String tipoComprobante = "BOLETA";

    @NotNull @Size(min = 1, message = "Debe incluir al menos un producto")
    @Valid
    private List<ItemVentaRequest> items;

    private BigDecimal descuentoGlobal = BigDecimal.ZERO;

    @NotBlank(message = "El método de pago es obligatorio")
    private String metodoPago = "EFECTIVO";

    private BigDecimal montoPagado = BigDecimal.ZERO;

    private String notas;

    @Data
    public static class ItemVentaRequest {
        @NotBlank(message = "El producto es obligatorio")
        private String productoId;

        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        private int cantidad;

        private BigDecimal descuento = BigDecimal.ZERO;
    }
}
