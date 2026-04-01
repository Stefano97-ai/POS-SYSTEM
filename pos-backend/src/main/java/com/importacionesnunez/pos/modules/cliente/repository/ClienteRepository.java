package com.importacionesnunez.pos.modules.cliente.repository;

import com.importacionesnunez.pos.modules.cliente.entity.Cliente;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ClienteRepository extends JpaRepository<Cliente, String> {

    Page<Cliente> findByActivoTrue(Pageable pageable);

    Optional<Cliente> findByTipoDocumentoAndNumeroDocumento(String tipoDoc, String numDoc);

    @Query("SELECT c FROM Cliente c WHERE c.activo = true AND " +
           "(LOWER(c.nombre) LIKE LOWER(CONCAT('%',:q,'%')) OR " +
           "c.numeroDocumento LIKE CONCAT('%',:q,'%') OR " +
           "LOWER(c.razonSocial) LIKE LOWER(CONCAT('%',:q,'%')))")
    List<Cliente> buscar(@Param("q") String query);

    @Query("SELECT c FROM Cliente c WHERE c.activo = true ORDER BY c.totalCompras DESC")
    List<Cliente> findTopClientes(Pageable pageable);
}
