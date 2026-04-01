package com.importacionesnunez.pos.modules.proveedor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProveedorDto {
    private String id;
    private String ruc;
    private String nombre;
    private String contacto;
    private String telefono;
    private String email;
    private String direccion;
    private String notas;
    private Boolean activo;
    private List<String> productoIds;
}
