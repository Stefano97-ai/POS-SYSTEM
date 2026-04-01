package com.importacionesnunez.pos.modules.producto.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.modules.producto.entity.Categoria;
import com.importacionesnunez.pos.modules.producto.service.CategoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/categorias")
@RequiredArgsConstructor
public class CategoriaController {

    private final CategoriaService categoriaService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Categoria>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(categoriaService.listarActivas()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Categoria>> crear(@RequestBody Map<String, String> body) {
        Categoria cat = categoriaService.crear(body.get("nombre"), body.get("descripcion"));
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Categoría creada", cat));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Categoria>> actualizar(@PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Categoría actualizada",
                categoriaService.actualizar(id, body.get("nombre"), body.get("descripcion"))));
    }
}
