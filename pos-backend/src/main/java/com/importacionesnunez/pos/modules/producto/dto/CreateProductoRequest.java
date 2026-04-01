package com.importacionesnunez.pos.modules.producto.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateProductoRequest {
    private String codigo;

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200)
    private String nombre;

    private String descripcion;
    private String categoriaId;

    @DecimalMin(value = "0.00", message = "El precio de compra no puede ser negativo")
    private BigDecimal precioCompra;

    @NotNull(message = "El precio de venta es obligatorio")
    @DecimalMin(value = "0.01", message = "El precio de venta debe ser mayor a 0")
    private BigDecimal precioVenta;

    @Min(value = 0, message = "El stock no puede ser negativo")
    private Integer stock = 0;

    @Min(value = 0)
    private Integer stockMinimo = 5;

    private String unidadMedida = "UND";
    private String modelo;
    private String tamanio;
    private String color;
    private String material;
    private String codigoBarras;
}
