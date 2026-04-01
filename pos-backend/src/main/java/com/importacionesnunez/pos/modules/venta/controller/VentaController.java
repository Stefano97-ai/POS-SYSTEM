package com.importacionesnunez.pos.modules.venta.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.common.dto.PageResponse;
import com.importacionesnunez.pos.modules.facturacion.dto.ComprobanteDto;
import com.importacionesnunez.pos.modules.facturacion.dto.NotaCreditoRequest;
import com.importacionesnunez.pos.modules.facturacion.service.ComprobanteService;
import com.importacionesnunez.pos.modules.venta.dto.CreateVentaRequest;
import com.importacionesnunez.pos.modules.venta.dto.VentaDto;
import com.importacionesnunez.pos.modules.venta.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ventas")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
public class VentaController {

    private final VentaService ventaService;
    private final ComprobanteService comprobanteService;

    @PostMapping
    public ResponseEntity<ApiResponse<VentaDto>> crear(@Valid @RequestBody CreateVentaRequest request) {
        VentaDto venta = ventaService.crearVenta(request);
        // Emitir comprobante automáticamente
        try {
            ComprobanteDto comprobante = comprobanteService.emitirComprobante(venta.getId());
            venta.setComprobanteNumero(comprobante.getNumeroCompleto());
            venta.setComprobanteEstado(comprobante.getEstadoSunat());
        } catch (Exception e) {
            // Venta se registra aunque falle la facturación
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Venta registrada", venta));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<VentaDto>>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(ventaService.listar(pageable))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VentaDto>> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(ventaService.obtenerPorId(id)));
    }

    @PostMapping("/{id}/anular")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<VentaDto>> anular(@PathVariable String id,
                                                         @Valid @RequestBody NotaCreditoRequest request) {
        VentaDto venta = ventaService.anularVenta(id);
        try {
            comprobanteService.emitirNotaCredito(id, request.getMotivo());
        } catch (Exception ignored) {}
        return ResponseEntity.ok(ApiResponse.ok("Venta anulada", venta));
    }
}
