package com.importacionesnunez.pos.modules.cliente.entity;

import com.importacionesnunez.pos.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "clientes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Cliente extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "tipo_documento", nullable = false, length = 10)
    @Builder.Default
    private String tipoDocumento = "DNI";

    @Column(name = "numero_documento", length = 20)
    private String numeroDocumento;

    @Column(name = "tipo_cliente", nullable = false, length = 20)
    @Builder.Default
    private String tipoCliente = "PERSONA";

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(name = "razon_social", length = 200)
    private String razonSocial;

    @Column(length = 300)
    private String direccion;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String clasificacion = "NUEVO";

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(name = "total_compras", precision = 14, scale = 2)
    @Builder.Default
    private BigDecimal totalCompras = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
