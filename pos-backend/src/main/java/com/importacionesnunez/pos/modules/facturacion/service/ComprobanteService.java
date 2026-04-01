package com.importacionesnunez.pos.modules.facturacion.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.BusinessException;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import com.importacionesnunez.pos.modules.configuracion.repository.ConfiguracionRepository;
import com.importacionesnunez.pos.modules.facturacion.dto.ComprobanteDto;
import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import com.importacionesnunez.pos.modules.facturacion.entity.SerieCorrelativo;
import com.importacionesnunez.pos.modules.facturacion.repository.ComprobanteRepository;
import com.importacionesnunez.pos.modules.facturacion.repository.SerieCorrelativoRepository;
import com.importacionesnunez.pos.modules.venta.entity.Venta;
import com.importacionesnunez.pos.modules.venta.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ComprobanteService {

    private final ComprobanteRepository comprobanteRepository;
    private final SerieCorrelativoRepository serieCorrelativoRepository;
    private final VentaRepository ventaRepository;
    private final ConfiguracionRepository configuracionRepository;
    private final XmlGeneratorService xmlGeneratorService;
    private final PdfGeneratorService pdfGeneratorService;
    private final FirmaDigitalService firmaDigitalService;
    private final OseIntegrationService oseIntegrationService;
    private final AuditService auditService;

    // =================== EMITIR COMPROBANTE ===================

    @Transactional
    public ComprobanteDto emitirComprobante(String ventaId) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", "id", ventaId));

        if (comprobanteRepository.findByVentaId(ventaId).isPresent()) {
            throw new BusinessException("Ya existe un comprobante para esta venta");
        }

        ConfiguracionEmpresa config = getConfig();
        String tipoComprobante = venta.getTipoComprobante();

        // Obtener serie y correlativo
        SerieCorrelativo serie = serieCorrelativoRepository.findByTipoComprobanteAndActivaTrue(tipoComprobante)
                .orElseThrow(() -> new BusinessException("No hay serie activa para: " + tipoComprobante));
        int correlativo = serie.siguienteCorrelativo();
        serieCorrelativoRepository.save(serie);

        String numeroCompleto = serie.getSerie() + "-" + String.format("%08d", correlativo);

        // Crear comprobante
        Comprobante comprobante = Comprobante.builder()
                .venta(venta)
                .tipoComprobante(tipoComprobante)
                .serie(serie.getSerie())
                .correlativo(correlativo)
                .numeroCompleto(numeroCompleto)
                .fechaEmision(LocalDateTime.now())
                .subtotal(venta.getSubtotal())
                .igv(venta.getIgv())
                .total(venta.getTotal())
                .build();

        // Datos del cliente
        if (venta.getCliente() != null) {
            comprobante.setClienteTipoDoc(venta.getCliente().getTipoDocumento());
            comprobante.setClienteNumeroDoc(venta.getCliente().getNumeroDocumento());
            comprobante.setClienteNombre(venta.getCliente().getRazonSocial() != null ?
                    venta.getCliente().getRazonSocial() : venta.getCliente().getNombre());
            comprobante.setClienteDireccion(venta.getCliente().getDireccion());
        } else {
            comprobante.setClienteNombre("Cliente General");
        }

        // 1. Generar XML UBL 2.1
        String xml = xmlGeneratorService.generarXml(comprobante, venta, config);
        comprobante.setXmlContenido(xml);

        // 2. Firmar XML con certificado digital
        String xmlFirmado = firmaDigitalService.firmarXml(xml, config);
        comprobante.setXmlFirmado(xmlFirmado);

        // 3. Enviar al OSE/SUNAT
        Map<String, String> resultado = oseIntegrationService.enviarComprobante(comprobante, xmlFirmado, config);
        aplicarResultado(comprobante, resultado);

        comprobante = comprobanteRepository.save(comprobante);

        auditService.registrar("EMITIR", "COMPROBANTE", comprobante.getId(),
                String.format("%s %s - Estado: %s", tipoComprobante, numeroCompleto, comprobante.getEstadoSunat()));

        return toDto(comprobante);
    }

    // =================== NOTA DE CRÉDITO ===================

    @Transactional
    public ComprobanteDto emitirNotaCredito(String ventaId, String motivo) {
        return emitirNota(ventaId, motivo, "NOTA_CREDITO");
    }

    // =================== NOTA DE DÉBITO ===================

    @Transactional
    public ComprobanteDto emitirNotaDebito(String ventaId, String motivo) {
        return emitirNota(ventaId, motivo, "NOTA_DEBITO");
    }

    private ComprobanteDto emitirNota(String ventaId, String motivo, String tipo) {
        Venta venta = ventaRepository.findById(ventaId)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", "id", ventaId));

        Comprobante comprobanteOriginal = comprobanteRepository.findByVentaId(ventaId)
                .orElseThrow(() -> new BusinessException("No existe comprobante para esta venta"));

        ConfiguracionEmpresa config = getConfig();

        SerieCorrelativo serie = serieCorrelativoRepository.findByTipoComprobanteAndActivaTrue(tipo)
                .orElseThrow(() -> new BusinessException("No hay serie activa para " + tipo));
        int correlativo = serie.siguienteCorrelativo();
        serieCorrelativoRepository.save(serie);

        String numeroCompleto = serie.getSerie() + "-" + String.format("%08d", correlativo);

        Comprobante nota = Comprobante.builder()
                .venta(venta)
                .tipoComprobante(tipo)
                .serie(serie.getSerie())
                .correlativo(correlativo)
                .numeroCompleto(numeroCompleto)
                .fechaEmision(LocalDateTime.now())
                .subtotal(venta.getSubtotal())
                .igv(venta.getIgv())
                .total(venta.getTotal())
                .clienteTipoDoc(comprobanteOriginal.getClienteTipoDoc())
                .clienteNumeroDoc(comprobanteOriginal.getClienteNumeroDoc())
                .clienteNombre(comprobanteOriginal.getClienteNombre())
                .clienteDireccion(comprobanteOriginal.getClienteDireccion())
                .comprobanteReferencia(comprobanteOriginal)
                .motivoNota(motivo)
                .build();

        // 1. Generar XML
        String xml = xmlGeneratorService.generarXml(nota, venta, config);
        nota.setXmlContenido(xml);

        // 2. Firmar
        String xmlFirmado = firmaDigitalService.firmarXml(xml, config);
        nota.setXmlFirmado(xmlFirmado);

        // 3. Enviar
        Map<String, String> resultado = oseIntegrationService.enviarComprobante(nota, xmlFirmado, config);
        aplicarResultado(nota, resultado);

        nota = comprobanteRepository.save(nota);

        auditService.registrar("EMITIR", tipo, nota.getId(),
                String.format("%s %s ref %s. Motivo: %s", tipo, numeroCompleto,
                        comprobanteOriginal.getNumeroCompleto(), motivo));

        return toDto(nota);
    }

    // =================== REENVIAR ===================

    @Transactional
    public ComprobanteDto reenviar(String id) {
        Comprobante comprobante = comprobanteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante", "id", id));

        ConfiguracionEmpresa config = getConfig();

        // Regenerar firma si no existe
        String xmlFirmado = comprobante.getXmlFirmado();
        if (xmlFirmado == null || xmlFirmado.isBlank()) {
            xmlFirmado = firmaDigitalService.firmarXml(comprobante.getXmlContenido(), config);
            comprobante.setXmlFirmado(xmlFirmado);
        }

        Map<String, String> resultado = oseIntegrationService.enviarComprobante(comprobante, xmlFirmado, config);
        aplicarResultado(comprobante, resultado);

        comprobante = comprobanteRepository.save(comprobante);
        return toDto(comprobante);
    }

    // =================== COMUNICACIÓN DE BAJA ===================

    @Transactional
    public ComprobanteDto comunicacionBaja(String comprobanteId, String motivo) {
        Comprobante comprobante = comprobanteRepository.findById(comprobanteId)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante", "id", comprobanteId));

        if (!"ACEPTADO".equals(comprobante.getEstadoSunat())) {
            throw new BusinessException("Solo se puede dar de baja a comprobantes ACEPTADOS");
        }

        ConfiguracionEmpresa config = getConfig();

        // Generar identificador: RA-{fecha}-{correlativo}
        String identificador = "RA-" + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + System.currentTimeMillis() % 10000;

        // Generar XML de comunicación de baja
        String xml = xmlGeneratorService.generarComunicacionBajaXml(
                identificador, LocalDate.now(),
                comprobante.getFechaEmision().toLocalDate(),
                List.of(comprobante), motivo, config);

        // Firmar y enviar
        String xmlFirmado = firmaDigitalService.firmarXml(xml, config);
        Map<String, String> resultado = oseIntegrationService.enviarComunicacionBaja(xmlFirmado, config);

        // Actualizar estado
        if ("ACEPTADO".equals(resultado.get("estadoSunat"))) {
            comprobante.setEstadoSunat("ANULADO");
            comprobante.setMensajeSunat("Comunicación de baja procesada. Motivo: " + motivo);
            if (resultado.get("ticket") != null) {
                comprobante.setTicketSunat(resultado.get("ticket"));
            }
        } else {
            comprobante.setMensajeSunat("Error en comunicación de baja: " + resultado.get("mensajeSunat"));
        }

        comprobante = comprobanteRepository.save(comprobante);

        auditService.registrar("ANULAR", "COMPROBANTE", comprobante.getId(),
                String.format("Comunicación de baja %s. Motivo: %s", comprobante.getNumeroCompleto(), motivo));

        return toDto(comprobante);
    }

    // =================== RESUMEN DIARIO ===================

    @Transactional
    public Map<String, String> generarResumenDiario() {
        LocalDateTime inicio = LocalDate.now().atStartOfDay();
        LocalDateTime fin = inicio.plusDays(1);
        var boletas = comprobanteRepository.findByTipoComprobanteAndFechaEmisionBetween("BOLETA", inicio, fin);

        if (boletas.isEmpty()) {
            return Map.of("mensaje", "No hay boletas para el resumen diario de hoy");
        }

        ConfiguracionEmpresa config = getConfig();

        // Generar identificador: RC-{fecha}-{correlativo}
        String identificador = "RC-" + LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-" + (boletas.size());

        String xml = xmlGeneratorService.generarResumenDiarioXml(
                identificador, LocalDate.now(), LocalDate.now(), boletas, config);

        String xmlFirmado = firmaDigitalService.firmarXml(xml, config);
        Map<String, String> resultado = oseIntegrationService.enviarResumenDiario(xmlFirmado, config);

        log.info("Resumen diario {} generado con {} boletas. Estado: {}",
                identificador, boletas.size(), resultado.get("estadoSunat"));

        auditService.registrar("EMITIR", "RESUMEN_DIARIO", identificador,
                String.format("Resumen diario con %d boletas. Ticket: %s",
                        boletas.size(), resultado.getOrDefault("ticket", "N/A")));

        return resultado;
    }

    // =================== CONSULTAR ESTADO SUNAT ===================

    public ComprobanteDto consultarEstadoSunat(String id) {
        Comprobante comprobante = comprobanteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante", "id", id));

        // Si tiene ticket pendiente, consultar el ticket
        if (comprobante.getTicketSunat() != null && !comprobante.getTicketSunat().isBlank()) {
            ConfiguracionEmpresa config = getConfig();
            Map<String, String> resultado = oseIntegrationService.consultarTicket(comprobante.getTicketSunat(), config);
            aplicarResultado(comprobante, resultado);
            comprobante = comprobanteRepository.save(comprobante);
        }

        return toDto(comprobante);
    }

    // =================== PDF / XML ===================

    public byte[] generarPdf(String id) {
        Comprobante comprobante = comprobanteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante", "id", id));
        Venta venta = comprobante.getVenta();
        ConfiguracionEmpresa config = getConfig();
        return pdfGeneratorService.generarPdf(comprobante, venta, config);
    }

    public String obtenerXml(String id) {
        Comprobante comprobante = comprobanteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante", "id", id));
        // Retornar XML firmado si existe, si no el original
        return comprobante.getXmlFirmado() != null ? comprobante.getXmlFirmado() : comprobante.getXmlContenido();
    }

    // =================== LISTADO ===================

    public Page<ComprobanteDto> listar(Pageable pageable) {
        return comprobanteRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toDto);
    }

    public ComprobanteDto obtenerPorId(String id) {
        Comprobante c = comprobanteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comprobante", "id", id));
        return toDto(c);
    }

    // =================== REINTENTO AUTOMÁTICO ===================

    /**
     * Cada 30 minutos, reintenta enviar comprobantes en estado PENDIENTE o ERROR.
     * Máximo 10 por ciclo para no sobrecargar.
     */
    @Scheduled(fixedRate = 1800000) // 30 minutos
    @Transactional
    public void reintentarPendientes() {
        List<Comprobante> pendientes = comprobanteRepository.findByEstadoSunatInOrderByCreatedAtAsc(
                List.of("PENDIENTE", "ERROR"));

        if (pendientes.isEmpty()) return;

        ConfiguracionEmpresa config = getConfig();
        int maxReintentos = Math.min(pendientes.size(), 10);
        log.info("Reintentando envío de {} comprobantes pendientes/error", maxReintentos);

        for (int i = 0; i < maxReintentos; i++) {
            Comprobante c = pendientes.get(i);
            try {
                String xmlFirmado = c.getXmlFirmado();
                if (xmlFirmado == null || xmlFirmado.isBlank()) {
                    xmlFirmado = firmaDigitalService.firmarXml(c.getXmlContenido(), config);
                    c.setXmlFirmado(xmlFirmado);
                }

                Map<String, String> resultado = oseIntegrationService.enviarComprobante(c, xmlFirmado, config);
                aplicarResultado(c, resultado);
                comprobanteRepository.save(c);

                log.info("Reintento {} {}: {}", c.getNumeroCompleto(), resultado.get("estadoSunat"),
                        resultado.getOrDefault("mensajeSunat", ""));
            } catch (Exception e) {
                log.error("Error reintentando {}: {}", c.getNumeroCompleto(), e.getMessage());
            }
        }
    }

    // =================== HELPERS ===================

    private void aplicarResultado(Comprobante comprobante, Map<String, String> resultado) {
        comprobante.setEstadoSunat(resultado.getOrDefault("estadoSunat", "PENDIENTE"));
        comprobante.setCodigoRespuesta(resultado.get("codigoRespuesta"));
        comprobante.setMensajeSunat(resultado.get("mensajeSunat"));
        if (resultado.get("hashCdr") != null) comprobante.setHashCdr(resultado.get("hashCdr"));
        if (resultado.get("cdrBase64") != null) comprobante.setCdrContenido(resultado.get("cdrBase64"));
        if (resultado.get("ticket") != null) comprobante.setTicketSunat(resultado.get("ticket"));
    }

    private ConfiguracionEmpresa getConfig() {
        return configuracionRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new BusinessException("Configuración de empresa no encontrada"));
    }

    private ComprobanteDto toDto(Comprobante c) {
        return ComprobanteDto.builder()
                .id(c.getId())
                .ventaId(c.getVenta() != null ? c.getVenta().getId() : null)
                .tipoComprobante(c.getTipoComprobante())
                .serie(c.getSerie()).correlativo(c.getCorrelativo())
                .numeroCompleto(c.getNumeroCompleto())
                .clienteTipoDoc(c.getClienteTipoDoc()).clienteNumeroDoc(c.getClienteNumeroDoc())
                .clienteNombre(c.getClienteNombre()).clienteDireccion(c.getClienteDireccion())
                .fechaEmision(c.getFechaEmision())
                .subtotal(c.getSubtotal()).igv(c.getIgv()).total(c.getTotal())
                .estadoSunat(c.getEstadoSunat()).hashCdr(c.getHashCdr())
                .mensajeSunat(c.getMensajeSunat()).codigoRespuesta(c.getCodigoRespuesta())
                .motivoNota(c.getMotivoNota())
                .comprobanteReferenciaId(c.getComprobanteReferencia() != null ? c.getComprobanteReferencia().getId() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
