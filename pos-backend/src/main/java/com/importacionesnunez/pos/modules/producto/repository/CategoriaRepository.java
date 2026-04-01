package com.importacionesnunez.pos.modules.producto.repository;

import com.importacionesnunez.pos.modules.producto.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CategoriaRepository extends JpaRepository<Categoria, String> {
    List<Categoria> findByActivaTrue();
    Optional<Categoria> findByNombre(String nombre);
    boolean existsByNombre(String nombre);
}
