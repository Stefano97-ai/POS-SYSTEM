package com.importacionesnunez.pos.modules.facturacion.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "series_correlativos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class SerieCorrelativo {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "tipo_comprobante", nullable = false, length = 20)
    private String tipoComprobante;

    @Column(nullable = false, length = 10)
    private String serie;

    @Column(name = "correlativo_actual", nullable = false)
    @Builder.Default
    private Integer correlativoActual = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activa = true;

    public int siguienteCorrelativo() {
        correlativoActual++;
        return correlativoActual;
    }
}
