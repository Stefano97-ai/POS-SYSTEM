package com.importacionesnunez.pos.modules.cliente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateClienteRequest {
    @NotBlank(message = "El tipo de documento es obligatorio")
    private String tipoDocumento = "DNI";

    private String numeroDocumento;

    private String tipoCliente = "PERSONA";

    @NotBlank(message = "El nombre es obligatorio")
    @Size(max = 200)
    private String nombre;

    private String razonSocial;
    private String direccion;
    private String telefono;
    private String email;
    private String clasificacion = "NUEVO";
    private String notas;
}
