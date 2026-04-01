package com.importacionesnunez.pos.modules.inventario.repository;

import com.importacionesnunez.pos.modules.inventario.entity.MovimientoInventario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, String> {
    Page<MovimientoInventario> findByProductoIdOrderByCreatedAtDesc(String productoId, Pageable pageable);
}
