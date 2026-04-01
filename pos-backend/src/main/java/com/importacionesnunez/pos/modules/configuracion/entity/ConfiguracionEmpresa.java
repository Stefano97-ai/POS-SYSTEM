package com.importacionesnunez.pos.modules.configuracion.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "configuracion_empresa")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ConfiguracionEmpresa {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 20)
    private String ruc;

    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @Column(name = "nombre_comercial", length = 200)
    private String nombreComercial;

    @Column(length = 300)
    private String direccion;

    @Column(length = 10)
    private String ubigeo;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "igv_porcentaje", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal igvPorcentaje = new BigDecimal("18.00");

    @Column(nullable = false, length = 5)
    @Builder.Default
    private String moneda = "PEN";

    @Column(name = "ose_provider", length = 50)
    private String oseProvider;

    @Column(name = "ose_api_url", length = 300)
    private String oseApiUrl;

    @Column(name = "ose_api_token", length = 500)
    private String oseApiToken;

    @Column(name = "ose_api_url_beta", length = 300)
    private String oseApiUrlBeta;

    @Column(name = "ose_mode", nullable = false, length = 20)
    @Builder.Default
    private String oseMode = "BETA";

    @Column(name = "ose_usuario_sol", length = 100)
    private String oseUsuarioSol;

    @Column(name = "ose_clave_sol", length = 200)
    private String oseClaveSol;

    @Column(name = "certificado_digital_path", length = 500)
    private String certificadoDigitalPath;

    @Column(name = "certificado_digital_password", length = 200)
    private String certificadoDigitalPassword;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
