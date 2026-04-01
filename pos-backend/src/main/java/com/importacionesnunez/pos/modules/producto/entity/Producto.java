package com.importacionesnunez.pos.modules.producto.entity;

import com.importacionesnunez.pos.common.audit.Auditable;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "productos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Producto extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "categoria_id")
    private Categoria categoria;

    @Column(name = "precio_compra", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal precioCompra = BigDecimal.ZERO;

    @Column(name = "precio_venta", nullable = false, precision = 12, scale = 2)
    private BigDecimal precioVenta;

    @Column(nullable = false)
    @Builder.Default
    private Integer stock = 0;

    @Column(name = "stock_minimo", nullable = false)
    @Builder.Default
    private Integer stockMinimo = 5;

    @Column(name = "unidad_medida", nullable = false, length = 20)
    @Builder.Default
    private String unidadMedida = "UND";

    @Column(length = 100)
    private String modelo;

    @Column(length = 50)
    private String tamanio;

    @Column(length = 50)
    private String color;

    @Column(length = 100)
    private String material;

    @Column(name = "codigo_barras", length = 100)
    private String codigoBarras;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
