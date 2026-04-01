package com.importacionesnunez.pos.modules.facturacion.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.common.dto.PageResponse;
import com.importacionesnunez.pos.modules.facturacion.dto.ComprobanteDto;
import com.importacionesnunez.pos.modules.facturacion.dto.NotaCreditoRequest;
import com.importacionesnunez.pos.modules.facturacion.service.ComprobanteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/comprobantes")
@RequiredArgsConstructor
public class ComprobanteController {

    private final ComprobanteService comprobanteService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ComprobanteDto>>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(comprobanteService.listar(pageable))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComprobanteDto>> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(comprobanteService.obtenerPorId(id)));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable String id) {
        byte[] pdf = comprobanteService.generarPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=comprobante-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/{id}/xml")
    public ResponseEntity<String> descargarXml(@PathVariable String id) {
        String xml = comprobanteService.obtenerXml(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=comprobante-" + id + ".xml")
                .contentType(MediaType.APPLICATION_XML)
                .body(xml);
    }

    @PostMapping("/{id}/reenviar")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComprobanteDto>> reenviar(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Comprobante reenviado", comprobanteService.reenviar(id)));
    }

    /** Consultar estado actual del comprobante en SUNAT */
    @GetMapping("/{id}/estado-sunat")
    public ResponseEntity<ApiResponse<ComprobanteDto>> consultarEstadoSunat(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(comprobanteService.consultarEstadoSunat(id)));
    }

    /** Emitir Nota de Crédito referenciando una venta existente */
    @PostMapping("/nota-credito")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<ApiResponse<ComprobanteDto>> notaCredito(@Valid @RequestBody NotaCreditoRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Nota de crédito emitida",
                comprobanteService.emitirNotaCredito(request.getVentaId(), request.getMotivo())));
    }

    /** Emitir Nota de Débito referenciando una venta existente */
    @PostMapping("/nota-debito")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<ApiResponse<ComprobanteDto>> notaDebito(@Valid @RequestBody NotaCreditoRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Nota de débito emitida",
                comprobanteService.emitirNotaDebito(request.getVentaId(), request.getMotivo())));
    }

    /** Comunicación de Baja - anular comprobante aceptado en SUNAT */
    @PostMapping("/comunicacion-baja")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ComprobanteDto>> comunicacionBaja(@RequestBody Map<String, String> body) {
        String comprobanteId = body.get("comprobanteId");
        String motivo = body.getOrDefault("motivo", "Anulación de comprobante");
        return ResponseEntity.ok(ApiResponse.ok("Comunicación de baja enviada",
                comprobanteService.comunicacionBaja(comprobanteId, motivo)));
    }

    /** Generar Resumen Diario de boletas */
    @PostMapping("/resumen-diario")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> resumenDiario() {
        return ResponseEntity.ok(ApiResponse.ok("Resumen diario generado",
                comprobanteService.generarResumenDiario()));
    }
}
