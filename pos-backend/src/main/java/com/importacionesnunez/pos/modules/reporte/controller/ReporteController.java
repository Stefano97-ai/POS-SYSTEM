package com.importacionesnunez.pos.modules.reporte.controller;

import com.importacionesnunez.pos.common.dto.ApiResponse;
import com.importacionesnunez.pos.modules.reporte.dto.DashboardDto;
import com.importacionesnunez.pos.modules.reporte.dto.ReporteVentasDto;
import com.importacionesnunez.pos.modules.reporte.service.ReporteService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final ReporteService reporteService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardDto>> dashboard() {
        return ResponseEntity.ok(ApiResponse.ok(reporteService.getDashboard()));
    }

    @GetMapping("/ventas")
    public ResponseEntity<ApiResponse<ReporteVentasDto>> reporteVentas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return ResponseEntity.ok(ApiResponse.ok(reporteService.reporteVentas(desde, hasta)));
    }

    @GetMapping("/exportar/excel")
    public ResponseEntity<byte[]> exportarExcel(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        byte[] excel = reporteService.exportarExcel(desde, hasta);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=reporte-ventas.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }
}
