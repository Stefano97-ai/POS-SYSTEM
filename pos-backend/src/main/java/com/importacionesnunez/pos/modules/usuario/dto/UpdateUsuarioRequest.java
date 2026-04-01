package com.importacionesnunez.pos.modules.usuario.dto;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class UpdateUsuarioRequest {
    private String nombreCompleto;
    @Email(message = "Email inválido")
    private String email;
    private String rol;
    private String password;
}
