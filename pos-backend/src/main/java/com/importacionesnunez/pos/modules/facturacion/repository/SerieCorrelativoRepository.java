package com.importacionesnunez.pos.modules.facturacion.repository;

import com.importacionesnunez.pos.modules.facturacion.entity.SerieCorrelativo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SerieCorrelativoRepository extends JpaRepository<SerieCorrelativo, String> {
    Optional<SerieCorrelativo> findByTipoComprobanteAndActivaTrue(String tipoComprobante);
    List<SerieCorrelativo> findAllByOrderByTipoComprobante();
}
