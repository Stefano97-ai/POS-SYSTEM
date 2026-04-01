package com.importacionesnunez.pos.modules.inventario.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.common.dto.PageResponse;
import com.importacionesnunez.pos.modules.inventario.dto.AjusteStockRequest;
import com.importacionesnunez.pos.modules.inventario.dto.EntradaStockRequest;
import com.importacionesnunez.pos.modules.inventario.dto.MovimientoDto;
import com.importacionesnunez.pos.modules.inventario.service.InventarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/inventario")
@RequiredArgsConstructor
public class InventarioController {

    private final InventarioService inventarioService;

    @GetMapping("/kardex/{productoId}")
    public ResponseEntity<ApiResponse<PageResponse<MovimientoDto>>> kardex(
            @PathVariable String productoId, @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(inventarioService.kardex(productoId, pageable))));
    }

    @PostMapping("/entrada")
    @PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
    public ResponseEntity<ApiResponse<MovimientoDto>> entrada(@Valid @RequestBody EntradaStockRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Entrada registrada", inventarioService.registrarEntrada(request)));
    }

    @PostMapping("/ajuste")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MovimientoDto>> ajuste(@Valid @RequestBody AjusteStockRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Ajuste registrado", inventarioService.registrarAjuste(request)));
    }
}
