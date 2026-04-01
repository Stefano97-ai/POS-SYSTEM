package com.importacionesnunez.pos.modules.producto.repository;

import com.importacionesnunez.pos.modules.producto.entity.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, String> {

    Page<Producto> findByActivoTrue(Pageable pageable);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(p.codigo) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "LOWER(p.codigoBarras) LIKE LOWER(CONCAT('%',:q,'%')))")
    List<Producto> buscar(@Param("q") String query);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND p.stock <= p.stockMinimo")
    List<Producto> findStockBajo();

    Page<Producto> findByActivoTrueAndCategoriaId(String categoriaId, Pageable pageable);

    boolean existsByCodigo(String codigo);
}
