package com.importacionesnunez.pos.modules.cliente.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ClienteDto {
    private String id;
    private String tipoDocumento;
    private String numeroDocumento;
    private String tipoCliente;
    private String nombre;
    private String razonSocial;
    private String direccion;
    private String telefono;
    private String email;
    private String clasificacion;
    private String notas;
    private BigDecimal totalCompras;
    private Boolean activo;
}
