package com.importacionesnunez.pos.modules.configuracion.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.configuracion.dto.ConfiguracionDto;
import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import com.importacionesnunez.pos.modules.configuracion.repository.ConfiguracionRepository;
import com.importacionesnunez.pos.modules.facturacion.entity.SerieCorrelativo;
import com.importacionesnunez.pos.modules.facturacion.repository.SerieCorrelativoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConfiguracionService {

    private final ConfiguracionRepository configuracionRepository;
    private final SerieCorrelativoRepository serieCorrelativoRepository;
    private final AuditService auditService;

    public ConfiguracionDto obtener() {
        ConfiguracionEmpresa config = configuracionRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Configuración de empresa no encontrada"));
        return toDto(config);
    }

    @Transactional
    public ConfiguracionDto actualizar(ConfiguracionDto dto) {
        ConfiguracionEmpresa config = configuracionRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Configuración de empresa no encontrada"));

        config.setRuc(dto.getRuc());
        config.setRazonSocial(dto.getRazonSocial());
        config.setNombreComercial(dto.getNombreComercial());
        config.setDireccion(dto.getDireccion());
        config.setUbigeo(dto.getUbigeo());
        config.setTelefono(dto.getTelefono());
        config.setEmail(dto.getEmail());
        if (dto.getLogoUrl() != null) config.setLogoUrl(dto.getLogoUrl());
        if (dto.getIgvPorcentaje() != null) config.setIgvPorcentaje(dto.getIgvPorcentaje());
        if (dto.getMoneda() != null) config.setMoneda(dto.getMoneda());
        if (dto.getOseProvider() != null) config.setOseProvider(dto.getOseProvider());
        if (dto.getOseApiUrl() != null) config.setOseApiUrl(dto.getOseApiUrl());
        if (dto.getOseApiToken() != null) config.setOseApiToken(dto.getOseApiToken());
        if (dto.getOseApiUrlBeta() != null) config.setOseApiUrlBeta(dto.getOseApiUrlBeta());
        if (dto.getOseMode() != null) config.setOseMode(dto.getOseMode());
        if (dto.getOseUsuarioSol() != null) config.setOseUsuarioSol(dto.getOseUsuarioSol());
        if (dto.getOseClaveSol() != null) config.setOseClaveSol(dto.getOseClaveSol());
        if (dto.getCertificadoDigitalPath() != null) config.setCertificadoDigitalPath(dto.getCertificadoDigitalPath());
        if (dto.getCertificadoDigitalPassword() != null) config.setCertificadoDigitalPassword(dto.getCertificadoDigitalPassword());

        config = configuracionRepository.save(config);
        auditService.registrar("ACTUALIZAR", "CONFIGURACION", config.getId(), "Configuración actualizada");
        return toDto(config);
    }

    public List<SerieCorrelativo> obtenerSeries() {
        return serieCorrelativoRepository.findAllByOrderByTipoComprobante();
    }

    @Transactional
    public SerieCorrelativo actualizarSerie(String id, String serie) {
        SerieCorrelativo sc = serieCorrelativoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Serie", "id", id));
        sc.setSerie(serie);
        return serieCorrelativoRepository.save(sc);
    }

    private ConfiguracionDto toDto(ConfiguracionEmpresa c) {
        return ConfiguracionDto.builder()
                .id(c.getId()).ruc(c.getRuc()).razonSocial(c.getRazonSocial())
                .nombreComercial(c.getNombreComercial()).direccion(c.getDireccion())
                .ubigeo(c.getUbigeo()).telefono(c.getTelefono()).email(c.getEmail())
                .logoUrl(c.getLogoUrl()).igvPorcentaje(c.getIgvPorcentaje())
                .moneda(c.getMoneda()).oseProvider(c.getOseProvider())
                .oseApiUrl(c.getOseApiUrl()).oseApiToken(c.getOseApiToken())
                .oseApiUrlBeta(c.getOseApiUrlBeta()).oseMode(c.getOseMode())
                .oseUsuarioSol(c.getOseUsuarioSol()).oseClaveSol(c.getOseClaveSol())
                .certificadoDigitalPath(c.getCertificadoDigitalPath())
                .build();
    }
}
