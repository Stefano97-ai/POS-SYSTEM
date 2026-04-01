package com.importacionesnunez.pos.modules.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "El usuario es obligatorio")
    private String username;
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
