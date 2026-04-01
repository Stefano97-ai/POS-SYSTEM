package com.importacionesnunez.pos.modules.producto.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.common.dto.PageResponse;
import com.importacionesnunez.pos.modules.producto.dto.CreateProductoRequest;
import com.importacionesnunez.pos.modules.producto.dto.ProductoDto;
import com.importacionesnunez.pos.modules.producto.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ProductoDto>>> listar(
            @PageableDefault(size = 20) Pageable pageable,
            @RequestParam(required = false) String categoriaId) {
        if (categoriaId != null) {
            return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(productoService.listarPorCategoria(categoriaId, pageable))));
        }
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(productoService.listar(pageable))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductoDto>> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(productoService.obtenerPorId(id)));
    }

    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<List<ProductoDto>>> buscar(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(productoService.buscar(q)));
    }

    @GetMapping("/stock-bajo")
    public ResponseEntity<ApiResponse<List<ProductoDto>>> stockBajo() {
        return ResponseEntity.ok(ApiResponse.ok(productoService.stockBajo()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductoDto>> crear(@Valid @RequestBody CreateProductoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Producto creado", productoService.crear(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ProductoDto>> actualizar(@PathVariable String id,
                                                                @Valid @RequestBody CreateProductoRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Producto actualizado", productoService.actualizar(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable String id) {
        productoService.desactivar(id);
        return ResponseEntity.ok(ApiResponse.ok("Producto desactivado"));
    }
}
