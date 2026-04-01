package com.importacionesnunez.pos.modules.venta.repository;

import com.importacionesnunez.pos.modules.venta.entity.Venta;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, String> {

    Page<Venta> findByEstadoNotOrderByCreatedAtDesc(String estado, Pageable pageable);

    @Query("SELECT v FROM Venta v WHERE v.createdAt BETWEEN :desde AND :hasta AND v.estado != 'ANULADA' ORDER BY v.createdAt DESC")
    List<Venta> findByFechaRango(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("SELECT COALESCE(SUM(v.total),0) FROM Venta v WHERE v.createdAt BETWEEN :desde AND :hasta AND v.estado != 'ANULADA'")
    BigDecimal sumTotalByFechaRango(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Query("SELECT COUNT(v) FROM Venta v WHERE v.createdAt BETWEEN :desde AND :hasta AND v.estado != 'ANULADA'")
    long countByFechaRango(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    List<Venta> findByClienteIdAndEstadoNot(String clienteId, String estado);

    @Query("SELECT v.metodoPago, COUNT(v), COALESCE(SUM(v.total),0) FROM Venta v WHERE v.createdAt BETWEEN :desde AND :hasta AND v.estado != 'ANULADA' GROUP BY v.metodoPago")
    List<Object[]> sumByMetodoPago(@Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);
}
