package com.importacionesnunez.pos.modules.venta.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.BusinessException;
import com.importacionesnunez.pos.common.exception.InsufficientStockException;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.cliente.entity.Cliente;
import com.importacionesnunez.pos.modules.cliente.repository.ClienteRepository;
import com.importacionesnunez.pos.modules.cliente.service.ClienteService;
import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import com.importacionesnunez.pos.modules.facturacion.repository.ComprobanteRepository;
import com.importacionesnunez.pos.modules.inventario.service.InventarioService;
import com.importacionesnunez.pos.modules.producto.entity.Producto;
import com.importacionesnunez.pos.modules.producto.repository.ProductoRepository;
import com.importacionesnunez.pos.modules.usuario.entity.Usuario;
import com.importacionesnunez.pos.modules.usuario.repository.UsuarioRepository;
import com.importacionesnunez.pos.modules.venta.dto.CreateVentaRequest;
import com.importacionesnunez.pos.modules.venta.dto.VentaDto;
import com.importacionesnunez.pos.modules.venta.entity.DetalleVenta;
import com.importacionesnunez.pos.modules.venta.entity.Venta;
import com.importacionesnunez.pos.modules.venta.repository.VentaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final ComprobanteRepository comprobanteRepository;
    private final InventarioService inventarioService;
    private final ClienteService clienteService;
    private final AuditService auditService;

    private static final BigDecimal IGV_FACTOR = new BigDecimal("1.18");

    @Transactional
    public VentaDto crearVenta(CreateVentaRequest req) {
        // Validar tipo comprobante
        if ("FACTURA".equals(req.getTipoComprobante()) && req.getClienteId() == null) {
            throw new BusinessException("Las facturas requieren un cliente con RUC");
        }

        Venta venta = new Venta();
        venta.setNumeroVenta(generarNumeroVenta());
        venta.setTipoComprobante(req.getTipoComprobante());
        venta.setMetodoPago(req.getMetodoPago());
        venta.setNotas(req.getNotas());
        venta.setEstado("COMPLETADA");

        // Cliente
        if (req.getClienteId() != null) {
            Cliente cliente = clienteRepository.findById(req.getClienteId())
                    .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", req.getClienteId()));
            if ("FACTURA".equals(req.getTipoComprobante()) && !"RUC".equals(cliente.getTipoDocumento())) {
                throw new BusinessException("Para facturas el cliente debe tener RUC");
            }
            venta.setCliente(cliente);
        }

        // Vendedor
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            usuarioRepository.findByUsername(username).ifPresent(venta::setVendedor);
        } catch (Exception ignored) {}

        // Procesar items
        BigDecimal subtotalBruto = BigDecimal.ZERO;
        BigDecimal descuentoTotal = req.getDescuentoGlobal() != null ? req.getDescuentoGlobal() : BigDecimal.ZERO;

        for (CreateVentaRequest.ItemVentaRequest item : req.getItems()) {
            Producto producto = productoRepository.findById(item.getProductoId())
                    .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", item.getProductoId()));

            if (producto.getStock() < item.getCantidad()) {
                throw new InsufficientStockException(producto.getNombre(), producto.getStock(), item.getCantidad());
            }

            BigDecimal descItem = item.getDescuento() != null ? item.getDescuento() : BigDecimal.ZERO;
            BigDecimal lineSubtotal = producto.getPrecioVenta()
                    .multiply(BigDecimal.valueOf(item.getCantidad()))
                    .subtract(descItem);

            DetalleVenta detalle = DetalleVenta.builder()
                    .producto(producto)
                    .productoNombre(producto.getNombre())
                    .cantidad(item.getCantidad())
                    .precioUnitario(producto.getPrecioVenta())
                    .descuento(descItem)
                    .subtotal(lineSubtotal)
                    .build();
            venta.addDetalle(detalle);

            subtotalBruto = subtotalBruto.add(lineSubtotal);

            // Descontar stock
            producto.setStock(producto.getStock() - item.getCantidad());
            productoRepository.save(producto);
            inventarioService.registrarSalida(producto, item.getCantidad(), venta.getNumeroVenta());
        }

        // Calcular totales (precios incluyen IGV)
        BigDecimal totalConIgv = subtotalBruto.subtract(descuentoTotal);
        BigDecimal subtotalSinIgv = totalConIgv.divide(IGV_FACTOR, 2, RoundingMode.HALF_UP);
        BigDecimal igv = totalConIgv.subtract(subtotalSinIgv);

        venta.setSubtotal(subtotalSinIgv);
        venta.setDescuento(descuentoTotal);
        venta.setIgv(igv);
        venta.setTotal(totalConIgv);

        // Pago
        BigDecimal montoPagado = req.getMontoPagado() != null ? req.getMontoPagado() : totalConIgv;
        venta.setMontoPagado(montoPagado);
        if ("EFECTIVO".equals(req.getMetodoPago())) {
            venta.setVuelto(montoPagado.subtract(totalConIgv).max(BigDecimal.ZERO));
        }

        venta = ventaRepository.save(venta);

        // Actualizar total compras del cliente
        if (venta.getCliente() != null) {
            clienteService.agregarCompra(venta.getCliente().getId(), totalConIgv);
        }

        auditService.registrar("CREAR", "VENTA", venta.getId(),
                String.format("Venta %s por S/ %s", venta.getNumeroVenta(), venta.getTotal()));

        return toDto(venta);
    }

    @Transactional(readOnly = true)
    public Page<VentaDto> listar(Pageable pageable) {
        return ventaRepository.findByEstadoNotOrderByCreatedAtDesc("ANULADA", pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public VentaDto obtenerPorId(String id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", "id", id));
        return toDto(venta);
    }

    @Transactional(readOnly = true)
    public List<VentaDto> historialCliente(String clienteId) {
        return ventaRepository.findByClienteIdAndEstadoNot(clienteId, "ANULADA")
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public VentaDto anularVenta(String id) {
        Venta venta = ventaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venta", "id", id));

        if ("ANULADA".equals(venta.getEstado())) {
            throw new BusinessException("Esta venta ya fue anulada");
        }

        // Devolver stock
        for (DetalleVenta det : venta.getDetalles()) {
            if (det.getProducto() != null) {
                Producto p = det.getProducto();
                p.setStock(p.getStock() + det.getCantidad());
                productoRepository.save(p);
            }
        }

        venta.setEstado("ANULADA");
        venta = ventaRepository.save(venta);
        auditService.registrar("ANULAR", "VENTA", venta.getId(), "Anulada venta: " + venta.getNumeroVenta());
        return toDto(venta);
    }

    private String generarNumeroVenta() {
        String fecha = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "V-" + fecha + "-" + rand;
    }

    public VentaDto toDto(Venta v) {
        Comprobante comp = null;
        try {
            comp = comprobanteRepository.findByVentaId(v.getId()).orElse(null);
        } catch (Exception ignored) {}

        List<VentaDto.DetalleVentaDto> detalles = v.getDetalles().stream().map(d ->
                VentaDto.DetalleVentaDto.builder()
                        .id(d.getId())
                        .productoId(d.getProducto() != null ? d.getProducto().getId() : null)
                        .productoNombre(d.getProductoNombre())
                        .cantidad(d.getCantidad())
                        .precioUnitario(d.getPrecioUnitario())
                        .descuento(d.getDescuento())
                        .subtotal(d.getSubtotal())
                        .build()
        ).toList();

        return VentaDto.builder()
                .id(v.getId()).numeroVenta(v.getNumeroVenta())
                .clienteId(v.getCliente() != null ? v.getCliente().getId() : null)
                .clienteNombre(v.getCliente() != null ? v.getCliente().getNombre() : "Cliente General")
                .clienteDocumento(v.getCliente() != null ? v.getCliente().getNumeroDocumento() : null)
                .tipoComprobante(v.getTipoComprobante())
                .subtotal(v.getSubtotal()).descuento(v.getDescuento()).igv(v.getIgv()).total(v.getTotal())
                .metodoPago(v.getMetodoPago()).montoPagado(v.getMontoPagado()).vuelto(v.getVuelto())
                .estado(v.getEstado()).notas(v.getNotas())
                .vendedorNombre(v.getVendedor() != null ? v.getVendedor().getNombreCompleto() : null)
                .detalles(detalles)
                .comprobanteNumero(comp != null ? comp.getNumeroCompleto() : null)
                .comprobanteId(comp != null ? comp.getId() : null)
                .comprobanteEstado(comp != null ? comp.getEstadoSunat() : null)
                .createdAt(v.getCreatedAt())
                .build();
    }
}
