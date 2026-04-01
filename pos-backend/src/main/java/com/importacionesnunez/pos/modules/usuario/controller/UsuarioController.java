package com.importacionesnunez.pos.modules.usuario.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.modules.usuario.dto.CreateUsuarioRequest;
import com.importacionesnunez.pos.modules.usuario.dto.UpdateUsuarioRequest;
import com.importacionesnunez.pos.modules.usuario.dto.UsuarioDto;
import com.importacionesnunez.pos.modules.usuario.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UsuarioDto>>> listar() {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.listarTodos()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDto>> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(usuarioService.obtenerPorId(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UsuarioDto>> crear(@Valid @RequestBody CreateUsuarioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Usuario creado", usuarioService.crear(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UsuarioDto>> actualizar(@PathVariable String id,
                                                               @Valid @RequestBody UpdateUsuarioRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Usuario actualizado", usuarioService.actualizar(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable String id) {
        usuarioService.desactivar(id);
        return ResponseEntity.ok(ApiResponse.ok("Usuario desactivado"));
    }
}
