package com.importacionesnunez.pos.modules.inventario.entity;

import com.importacionesnunez.pos.modules.producto.entity.Producto;
import com.importacionesnunez.pos.modules.proveedor.entity.Proveedor;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimientos_inventario")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MovimientoInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "tipo_movimiento", nullable = false, length = 20)
    private String tipoMovimiento; // ENTRADA, SALIDA, AJUSTE

    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "stock_anterior", nullable = false)
    private Integer stockAnterior;

    @Column(name = "stock_posterior", nullable = false)
    private Integer stockPosterior;

    @Column(name = "precio_unitario", precision = 12, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "documento_referencia", length = 100)
    private String documentoReferencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proveedor_id")
    private Proveedor proveedor;

    @Column(length = 300)
    private String motivo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
