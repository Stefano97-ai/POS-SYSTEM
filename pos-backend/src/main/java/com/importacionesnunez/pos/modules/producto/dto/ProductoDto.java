package com.importacionesnunez.pos.modules.producto.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProductoDto {
    private String id;
    private String codigo;
    private String nombre;
    private String descripcion;
    private String categoriaId;
    private String categoriaNombre;
    private BigDecimal precioCompra;
    private BigDecimal precioVenta;
    private Integer stock;
    private Integer stockMinimo;
    private String unidadMedida;
    private String modelo;
    private String tamanio;
    private String color;
    private String material;
    private String codigoBarras;
    private Boolean activo;
    private Boolean stockBajo;
}
