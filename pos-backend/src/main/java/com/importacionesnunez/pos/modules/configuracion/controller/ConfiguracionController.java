package com.importacionesnunez.pos.modules.configuracion.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.modules.configuracion.dto.ConfiguracionDto;
import com.importacionesnunez.pos.modules.configuracion.service.ConfiguracionService;
import com.importacionesnunez.pos.modules.facturacion.entity.SerieCorrelativo;
import com.importacionesnunez.pos.modules.facturacion.service.FirmaDigitalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/configuracion")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ConfiguracionController {

    private final ConfiguracionService configuracionService;
    private final FirmaDigitalService firmaDigitalService;

    @GetMapping("/empresa")
    public ResponseEntity<ApiResponse<ConfiguracionDto>> obtener() {
        return ResponseEntity.ok(ApiResponse.ok(configuracionService.obtener()));
    }

    @PutMapping("/empresa")
    public ResponseEntity<ApiResponse<ConfiguracionDto>> actualizar(@Valid @RequestBody ConfiguracionDto dto) {
        return ResponseEntity.ok(ApiResponse.ok("Configuración actualizada", configuracionService.actualizar(dto)));
    }

    @GetMapping("/series")
    public ResponseEntity<ApiResponse<List<SerieCorrelativo>>> obtenerSeries() {
        return ResponseEntity.ok(ApiResponse.ok(configuracionService.obtenerSeries()));
    }

    @PutMapping("/series/{id}")
    public ResponseEntity<ApiResponse<SerieCorrelativo>> actualizarSerie(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(ApiResponse.ok("Serie actualizada",
                configuracionService.actualizarSerie(id, body.get("serie"))));
    }

    /** Subir certificado digital .pfx/.p12 */
    @PostMapping("/certificado")
    public ResponseEntity<ApiResponse<Map<String, Object>>> subirCertificado(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "password", required = false) String password) throws IOException {

        // Guardar el archivo en directorio de certificados
        Path certDir = Paths.get(System.getProperty("user.home"), ".pos-certs");
        Files.createDirectories(certDir);

        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "certificado.pfx";
        Path certPath = certDir.resolve(originalName);
        Files.write(certPath, file.getBytes());

        // Validar el certificado
        Map<String, Object> info = firmaDigitalService.validarCertificado(certPath.toString(), password);
        info.put("archivo", originalName);
        info.put("ruta", certPath.toString());

        if (Boolean.TRUE.equals(info.get("valido"))) {
            // Actualizar config con la ruta del certificado
            ConfiguracionDto dto = ConfiguracionDto.builder()
                    .ruc(configuracionService.obtener().getRuc())
                    .razonSocial(configuracionService.obtener().getRazonSocial())
                    .certificadoDigitalPath(certPath.toString())
                    .certificadoDigitalPassword(password)
                    .build();
            configuracionService.actualizar(dto);
        }

        return ResponseEntity.ok(ApiResponse.ok("Certificado procesado", info));
    }

    /** Validar certificado actual */
    @GetMapping("/certificado/validar")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validarCertificado() {
        ConfiguracionDto config = configuracionService.obtener();
        if (config.getCertificadoDigitalPath() == null || config.getCertificadoDigitalPath().isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of("valido", false, "error", "No hay certificado configurado")));
        }
        Map<String, Object> info = firmaDigitalService.validarCertificado(
                config.getCertificadoDigitalPath(), null);
        return ResponseEntity.ok(ApiResponse.ok(info));
    }
}
