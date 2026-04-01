package com.importacionesnunez.pos.modules.configuracion.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ConfiguracionDto {
    private String id;
    @NotBlank private String ruc;
    @NotBlank private String razonSocial;
    private String nombreComercial;
    private String direccion;
    private String ubigeo;
    private String telefono;
    private String email;
    private String logoUrl;
    private BigDecimal igvPorcentaje;
    private String moneda;
    private String oseProvider;
    private String oseApiUrl;
    private String oseApiToken;
    private String oseApiUrlBeta;
    private String oseMode;
    private String oseUsuarioSol;
    private String oseClaveSol;
    private String certificadoDigitalPath;
    private String certificadoDigitalPassword;
}
