package com.importacionesnunez.pos.modules.proveedor.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateProveedorRequest {
    private String ruc;
    @NotBlank(message = "El nombre es obligatorio")
    private String nombre;
    private String contacto;
    private String telefono;
    private String email;
    private String direccion;
    private String notas;
    private List<String> productoIds;
}
