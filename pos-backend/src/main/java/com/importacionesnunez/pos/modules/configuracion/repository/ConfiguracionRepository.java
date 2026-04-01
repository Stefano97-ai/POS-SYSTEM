package com.importacionesnunez.pos.modules.configuracion.repository;

import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConfiguracionRepository extends JpaRepository<ConfiguracionEmpresa, String> {
}
