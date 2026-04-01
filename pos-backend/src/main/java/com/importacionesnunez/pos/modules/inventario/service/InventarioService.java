package com.importacionesnunez.pos.modules.inventario.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.InsufficientStockException;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.inventario.dto.AjusteStockRequest;
import com.importacionesnunez.pos.modules.inventario.dto.EntradaStockRequest;
import com.importacionesnunez.pos.modules.inventario.dto.MovimientoDto;
import com.importacionesnunez.pos.modules.inventario.entity.MovimientoInventario;
import com.importacionesnunez.pos.modules.inventario.repository.MovimientoInventarioRepository;
import com.importacionesnunez.pos.modules.producto.entity.Producto;
import com.importacionesnunez.pos.modules.producto.repository.ProductoRepository;
import com.importacionesnunez.pos.modules.proveedor.entity.Proveedor;
import com.importacionesnunez.pos.modules.proveedor.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InventarioService {

    private final MovimientoInventarioRepository movimientoRepo;
    private final ProductoRepository productoRepository;
    private final ProveedorRepository proveedorRepository;
    private final AuditService auditService;

    public Page<MovimientoDto> kardex(String productoId, Pageable pageable) {
        return movimientoRepo.findByProductoIdOrderByCreatedAtDesc(productoId, pageable).map(this::toDto);
    }

    @Transactional
    public MovimientoDto registrarEntrada(EntradaStockRequest req) {
        Producto p = productoRepository.findById(req.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", req.getProductoId()));

        int stockAnterior = p.getStock();
        p.setStock(stockAnterior + req.getCantidad());
        if (req.getPrecioUnitario() != null) p.setPrecioCompra(req.getPrecioUnitario());
        productoRepository.save(p);

        Proveedor prov = null;
        if (req.getProveedorId() != null) {
            prov = proveedorRepository.findById(req.getProveedorId()).orElse(null);
        }

        MovimientoInventario mov = MovimientoInventario.builder()
                .producto(p).tipoMovimiento("ENTRADA").cantidad(req.getCantidad())
                .stockAnterior(stockAnterior).stockPosterior(p.getStock())
                .precioUnitario(req.getPrecioUnitario())
                .documentoReferencia(req.getDocumentoReferencia())
                .proveedor(prov).motivo(req.getMotivo())
                .createdBy(getUsuario()).build();

        mov = movimientoRepo.save(mov);
        auditService.registrar("ENTRADA_STOCK", "INVENTARIO", p.getId(),
                String.format("+%d unidades de %s", req.getCantidad(), p.getNombre()));
        return toDto(mov);
    }

    @Transactional
    public MovimientoDto registrarAjuste(AjusteStockRequest req) {
        Producto p = productoRepository.findById(req.getProductoId())
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", req.getProductoId()));

        int stockAnterior = p.getStock();
        int nuevoStock = stockAnterior + req.getCantidad();
        if (nuevoStock < 0) {
            throw new InsufficientStockException(p.getNombre(), stockAnterior, Math.abs(req.getCantidad()));
        }

        p.setStock(nuevoStock);
        productoRepository.save(p);

        MovimientoInventario mov = MovimientoInventario.builder()
                .producto(p).tipoMovimiento("AJUSTE").cantidad(req.getCantidad())
                .stockAnterior(stockAnterior).stockPosterior(nuevoStock)
                .motivo(req.getMotivo()).createdBy(getUsuario()).build();

        mov = movimientoRepo.save(mov);
        auditService.registrar("AJUSTE_STOCK", "INVENTARIO", p.getId(),
                String.format("Ajuste %+d: %s. Motivo: %s", req.getCantidad(), p.getNombre(), req.getMotivo()));
        return toDto(mov);
    }

    @Transactional
    public void registrarSalida(Producto producto, int cantidad, String documentoRef) {
        int stockAnterior = producto.getStock();
        MovimientoInventario mov = MovimientoInventario.builder()
                .producto(producto).tipoMovimiento("SALIDA").cantidad(cantidad)
                .stockAnterior(stockAnterior).stockPosterior(stockAnterior - cantidad)
                .documentoReferencia(documentoRef).motivo("Venta")
                .createdBy(getUsuario()).build();
        movimientoRepo.save(mov);
    }

    private String getUsuario() {
        try {
            return SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {
            return "SYSTEM";
        }
    }

    private MovimientoDto toDto(MovimientoInventario m) {
        return MovimientoDto.builder()
                .id(m.getId()).productoId(m.getProducto().getId())
                .productoNombre(m.getProducto().getNombre())
                .tipoMovimiento(m.getTipoMovimiento()).cantidad(m.getCantidad())
                .stockAnterior(m.getStockAnterior()).stockPosterior(m.getStockPosterior())
                .precioUnitario(m.getPrecioUnitario())
                .documentoReferencia(m.getDocumentoReferencia())
                .proveedorNombre(m.getProveedor() != null ? m.getProveedor().getNombre() : null)
                .motivo(m.getMotivo()).createdAt(m.getCreatedAt()).createdBy(m.getCreatedBy())
                .build();
    }
}
