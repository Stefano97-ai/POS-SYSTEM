package com.importacionesnunez.pos.modules.proveedor.entity;

import com.importacionesnunez.pos.modules.producto.entity.Producto;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "proveedores")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Proveedor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(length = 20)
    private String ruc;

    @Column(nullable = false, length = 200)
    private String nombre;

    @Column(length = 150)
    private String contacto;

    @Column(length = 20)
    private String telefono;

    @Column(length = 100)
    private String email;

    @Column(length = 300)
    private String direccion;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Column(nullable = false)
    @Builder.Default
    private Boolean activo = true;

    @ManyToMany
    @JoinTable(
        name = "proveedor_producto",
        joinColumns = @JoinColumn(name = "proveedor_id"),
        inverseJoinColumns = @JoinColumn(name = "producto_id")
    )
    @Builder.Default
    private Set<Producto> productos = new HashSet<>();

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
