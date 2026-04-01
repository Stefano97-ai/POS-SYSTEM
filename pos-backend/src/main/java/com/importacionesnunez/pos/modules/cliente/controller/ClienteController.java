package com.importacionesnunez.pos.modules.cliente.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.common.dto.PageResponse;
import com.importacionesnunez.pos.modules.cliente.dto.ClienteDto;
import com.importacionesnunez.pos.modules.cliente.dto.CreateClienteRequest;
import com.importacionesnunez.pos.modules.cliente.service.ClienteService;
import com.importacionesnunez.pos.modules.venta.dto.VentaDto;
import com.importacionesnunez.pos.modules.venta.service.VentaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clientes")
@RequiredArgsConstructor
public class ClienteController {

    private final ClienteService clienteService;
    private final VentaService ventaService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ClienteDto>>> listar(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(clienteService.listar(pageable))));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClienteDto>> obtener(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(clienteService.obtenerPorId(id)));
    }

    @GetMapping("/{id}/historial")
    public ResponseEntity<ApiResponse<List<VentaDto>>> historial(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(ventaService.historialCliente(id)));
    }

    @GetMapping("/buscar")
    public ResponseEntity<ApiResponse<List<ClienteDto>>> buscar(@RequestParam String q) {
        return ResponseEntity.ok(ApiResponse.ok(clienteService.buscar(q)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ClienteDto>> crear(@Valid @RequestBody CreateClienteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Cliente creado", clienteService.crear(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ClienteDto>> actualizar(@PathVariable String id,
                                                               @Valid @RequestBody CreateClienteRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Cliente actualizado", clienteService.actualizar(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> desactivar(@PathVariable String id) {
        clienteService.desactivar(id);
        return ResponseEntity.ok(ApiResponse.ok("Cliente desactivado"));
    }
}
