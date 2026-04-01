package com.importacionesnunez.pos.modules.usuario.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDto {
    private String id;
    private String username;
    private String nombreCompleto;
    private String email;
    private String rol;
    private Boolean activo;
    private LocalDateTime createdAt;
}
