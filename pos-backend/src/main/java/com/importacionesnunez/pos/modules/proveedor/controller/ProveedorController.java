package com.importacionesnunez.pos.modules.proveedor.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.modules.proveedor.dto.CreateProveedorRequest;
import com.importacionesnunez.pos.modules.proveedor.dto.ProveedorDto;
import com.importacionesnunez.pos.modules.proveedor.service.ProveedorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/proveedores")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'VENDEDOR')")
public class ProveedorController {

    private final ProveedorService proveedorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProveedorDto>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(proveedorService.listar()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProveedorDto>> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(proveedorService.obtenerPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProveedorDto>> crear(@Valid @RequestBody CreateProveedorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Proveedor creado", proveedorService.crear(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProveedorDto>> actualizar(@PathVariable String id,
                                                                 @Valid @RequestBody CreateProveedorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Proveedor actualizado", proveedorService.actualizar(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable String id) {
        proveedorService.desactivar(id);
        return ResponseEntity.ok(ApiResponse.ok("Proveedor desactivado"));
    }
}
