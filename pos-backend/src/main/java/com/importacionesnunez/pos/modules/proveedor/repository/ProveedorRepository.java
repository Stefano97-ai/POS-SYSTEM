package com.importacionesnunez.pos.modules.proveedor.repository;

import com.importacionesnunez.pos.modules.proveedor.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProveedorRepository extends JpaRepository<Proveedor, String> {
    List<Proveedor> findByActivoTrue();
}
