package com.importacionesnunez.pos.modules.facturacion.repository;

import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ComprobanteRepository extends JpaRepository<Comprobante, String> {
    Page<Comprobante> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Optional<Comprobante> findByVentaId(String ventaId);
    List<Comprobante> findByEstadoSunat(String estado);
    List<Comprobante> findByTipoComprobanteAndFechaEmisionBetween(String tipo, LocalDateTime desde, LocalDateTime hasta);
    List<Comprobante> findByEstadoSunatInOrderByCreatedAtAsc(List<String> estados);
}
