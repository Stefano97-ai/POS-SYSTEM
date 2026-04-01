package com.importacionesnunez.pos.modules.reporte.service;

import com.importacionesnunez.pos.modules.cliente.repository.ClienteRepository;
import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import com.importacionesnunez.pos.modules.facturacion.repository.ComprobanteRepository;
import com.importacionesnunez.pos.modules.producto.repository.ProductoRepository;
import com.importacionesnunez.pos.modules.reporte.dto.DashboardDto;
import com.importacionesnunez.pos.modules.reporte.dto.ReporteVentasDto;
import com.importacionesnunez.pos.modules.venta.entity.DetalleVenta;
import com.importacionesnunez.pos.modules.venta.entity.Venta;
import com.importacionesnunez.pos.modules.venta.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReporteService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final ComprobanteRepository comprobanteRepository;

    public DashboardDto getDashboard() {
        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        LocalDateTime finHoy = inicioHoy.plusDays(1);
        LocalDateTime inicioSemana = LocalDate.now().with(DayOfWeek.MONDAY).atStartOfDay();
        LocalDateTime inicioMes = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        BigDecimal ventasHoy = ventaRepository.sumTotalByFechaRango(inicioHoy, finHoy);
        BigDecimal ventasSemana = ventaRepository.sumTotalByFechaRango(inicioSemana, finHoy);
        BigDecimal ventasMes = ventaRepository.sumTotalByFechaRango(inicioMes, finHoy);
        long totalVentasHoy = ventaRepository.countByFechaRango(inicioHoy, finHoy);
        long totalVentasMes = ventaRepository.countByFechaRango(inicioMes, finHoy);

        // Productos top
        List<Venta> ventasMesLista = ventaRepository.findByFechaRango(inicioMes, finHoy);
        Map<String, long[]> productoCounts = new LinkedHashMap<>();
        Map<String, BigDecimal> productoTotals = new LinkedHashMap<>();

        for (Venta v : ventasMesLista) {
            for (DetalleVenta d : v.getDetalles()) {
                String nombre = d.getProductoNombre();
                productoCounts.computeIfAbsent(nombre, k -> new long[]{0})[0] += d.getCantidad();
                productoTotals.merge(nombre, d.getSubtotal(), BigDecimal::add);
            }
        }

        List<DashboardDto.ProductoTopDto> productosTop = productoCounts.entrySet().stream()
                .sorted((a, b) -> Long.compare(b.getValue()[0], a.getValue()[0]))
                .limit(5)
                .map(e -> DashboardDto.ProductoTopDto.builder()
                        .productoNombre(e.getKey())
                        .cantidadVendida(e.getValue()[0])
                        .totalVentas(productoTotals.getOrDefault(e.getKey(), BigDecimal.ZERO))
                        .build())
                .toList();

        // Ventas recientes
        List<Venta> recientes = ventaRepository.findByFechaRango(inicioHoy.minusDays(7), finHoy);
        List<DashboardDto.VentaRecienteDto> ventasRecientes = recientes.stream()
                .sorted(Comparator.comparing(Venta::getCreatedAt).reversed())
                .limit(10)
                .map(v -> DashboardDto.VentaRecienteDto.builder()
                        .id(v.getId()).numeroVenta(v.getNumeroVenta())
                        .clienteNombre(v.getCliente() != null ? v.getCliente().getNombre() : "General")
                        .total(v.getTotal()).metodoPago(v.getMetodoPago()).estado(v.getEstado())
                        .createdAt(v.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM HH:mm")))
                        .build())
                .toList();

        // Resumen métodos de pago
        List<Object[]> metodos = ventaRepository.sumByMetodoPago(inicioMes, finHoy);
        List<DashboardDto.MetodoPagoResumenDto> resumenPago = metodos.stream()
                .map(m -> DashboardDto.MetodoPagoResumenDto.builder()
                        .metodoPago((String) m[0]).cantidad((Long) m[1]).total((BigDecimal) m[2]).build())
                .toList();

        return DashboardDto.builder()
                .ventasHoy(ventasHoy).ventasSemana(ventasSemana).ventasMes(ventasMes)
                .totalVentasHoy(totalVentasHoy).totalVentasMes(totalVentasMes)
                .totalClientes(clienteRepository.count())
                .totalProductos(productoRepository.count())
                .productosStockBajo(productoRepository.findStockBajo().size())
                .productosTop(productosTop).ventasRecientes(ventasRecientes)
                .resumenMetodosPago(resumenPago)
                .build();
    }

    public ReporteVentasDto reporteVentas(LocalDate desde, LocalDate hasta) {
        LocalDateTime desdedt = desde.atStartOfDay();
        LocalDateTime hastadt = hasta.plusDays(1).atStartOfDay();

        List<Venta> ventas = ventaRepository.findByFechaRango(desdedt, hastadt);
        BigDecimal totalIngresos = ventas.stream().map(Venta::getTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalDescuentos = ventas.stream().map(Venta::getDescuento).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalIgv = ventas.stream().map(Venta::getIgv).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal promedio = ventas.isEmpty() ? BigDecimal.ZERO :
                totalIngresos.divide(BigDecimal.valueOf(ventas.size()), 2, RoundingMode.HALF_UP);

        List<ReporteVentasDto.VentaDetalleReporteDto> ventasDto = ventas.stream().map(v -> {
            Comprobante comp = comprobanteRepository.findByVentaId(v.getId()).orElse(null);
            return ReporteVentasDto.VentaDetalleReporteDto.builder()
                    .id(v.getId()).numeroVenta(v.getNumeroVenta())
                    .clienteNombre(v.getCliente() != null ? v.getCliente().getNombre() : "General")
                    .tipoComprobante(v.getTipoComprobante())
                    .comprobanteNumero(comp != null ? comp.getNumeroCompleto() : "-")
                    .total(v.getTotal()).metodoPago(v.getMetodoPago()).estado(v.getEstado())
                    .fecha(v.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                    .build();
        }).toList();

        return ReporteVentasDto.builder()
                .totalIngresos(totalIngresos).totalVentas(ventas.size())
                .promedioVenta(promedio).totalDescuentos(totalDescuentos).totalIgv(totalIgv)
                .ventas(ventasDto).build();
    }

    public byte[] exportarExcel(LocalDate desde, LocalDate hasta) {
        ReporteVentasDto reporte = reporteVentas(desde, hasta);

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Ventas");

            // Encabezados
            Row header = sheet.createRow(0);
            CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font font = workbook.createFont();
            font.setBold(true);
            headerStyle.setFont(font);

            String[] headers = {"N° Venta", "Cliente", "Tipo", "Comprobante", "Total", "Método Pago", "Estado", "Fecha"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos
            int rowNum = 1;
            for (ReporteVentasDto.VentaDetalleReporteDto v : reporte.getVentas()) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(v.getNumeroVenta());
                row.createCell(1).setCellValue(v.getClienteNombre());
                row.createCell(2).setCellValue(v.getTipoComprobante());
                row.createCell(3).setCellValue(v.getComprobanteNumero());
                row.createCell(4).setCellValue(v.getTotal().doubleValue());
                row.createCell(5).setCellValue(v.getMetodoPago());
                row.createCell(6).setCellValue(v.getEstado());
                row.createCell(7).setCellValue(v.getFecha());
            }

            // Fila de totales
            Row totalRow = sheet.createRow(rowNum + 1);
            totalRow.createCell(0).setCellValue("TOTAL");
            totalRow.createCell(4).setCellValue(reporte.getTotalIngresos().doubleValue());

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);

            workbook.write(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando Excel: " + e.getMessage(), e);
        }
    }
}
