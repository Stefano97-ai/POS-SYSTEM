package com.importacionesnunez.pos.modules.producto.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.BusinessException;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.producto.dto.CreateProductoRequest;
import com.importacionesnunez.pos.modules.producto.dto.ProductoDto;
import com.importacionesnunez.pos.modules.producto.entity.Categoria;
import com.importacionesnunez.pos.modules.producto.entity.Producto;
import com.importacionesnunez.pos.modules.producto.repository.CategoriaRepository;
import com.importacionesnunez.pos.modules.producto.repository.ProductoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ProductoDto> listar(Pageable pageable) {
        return productoRepository.findByActivoTrue(pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public Page<ProductoDto> listarPorCategoria(String categoriaId, Pageable pageable) {
        return productoRepository.findByActivoTrueAndCategoriaId(categoriaId, pageable).map(this::toDto);
    }

    @Transactional(readOnly = true)
    public ProductoDto obtenerPorId(String id) {
        return toDto(findById(id));
    }

    @Transactional(readOnly = true)
    public List<ProductoDto> buscar(String query) {
        return productoRepository.buscar(query).stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductoDto> stockBajo() {
        return productoRepository.findStockBajo().stream().map(this::toDto).toList();
    }

    @Transactional
    public ProductoDto crear(CreateProductoRequest req) {
        if (req.getCodigo() != null && productoRepository.existsByCodigo(req.getCodigo())) {
            throw new BusinessException("Ya existe un producto con el código: " + req.getCodigo());
        }

        Producto p = Producto.builder()
                .codigo(req.getCodigo()).nombre(req.getNombre()).descripcion(req.getDescripcion())
                .precioCompra(req.getPrecioCompra()).precioVenta(req.getPrecioVenta())
                .stock(req.getStock()).stockMinimo(req.getStockMinimo())
                .unidadMedida(req.getUnidadMedida()).modelo(req.getModelo())
                .tamanio(req.getTamanio()).color(req.getColor()).material(req.getMaterial())
                .codigoBarras(req.getCodigoBarras()).build();

        if (req.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(req.getCategoriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría", "id", req.getCategoriaId()));
            p.setCategoria(cat);
        }

        p = productoRepository.save(p);
        auditService.registrar("CREAR", "PRODUCTO", p.getId(), "Creado: " + p.getNombre());
        return toDto(p);
    }

    @Transactional
    public ProductoDto actualizar(String id, CreateProductoRequest req) {
        Producto p = findById(id);
        p.setNombre(req.getNombre());
        p.setDescripcion(req.getDescripcion());
        p.setPrecioCompra(req.getPrecioCompra());
        p.setPrecioVenta(req.getPrecioVenta());
        p.setStock(req.getStock());
        p.setStockMinimo(req.getStockMinimo());
        p.setUnidadMedida(req.getUnidadMedida());
        p.setModelo(req.getModelo());
        p.setTamanio(req.getTamanio());
        p.setColor(req.getColor());
        p.setMaterial(req.getMaterial());
        p.setCodigoBarras(req.getCodigoBarras());
        if (req.getCodigo() != null) p.setCodigo(req.getCodigo());

        if (req.getCategoriaId() != null) {
            Categoria cat = categoriaRepository.findById(req.getCategoriaId())
                    .orElseThrow(() -> new ResourceNotFoundException("Categoría", "id", req.getCategoriaId()));
            p.setCategoria(cat);
        } else {
            p.setCategoria(null);
        }

        p = productoRepository.save(p);
        auditService.registrar("ACTUALIZAR", "PRODUCTO", p.getId(), "Actualizado: " + p.getNombre());
        return toDto(p);
    }

    @Transactional
    public void desactivar(String id) {
        Producto p = findById(id);
        p.setActivo(false);
        productoRepository.save(p);
        auditService.registrar("DESACTIVAR", "PRODUCTO", id, "Desactivado: " + p.getNombre());
    }

    public Producto findById(String id) {
        return productoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Producto", "id", id));
    }

    public ProductoDto toDto(Producto p) {
        return ProductoDto.builder()
                .id(p.getId()).codigo(p.getCodigo()).nombre(p.getNombre())
                .descripcion(p.getDescripcion())
                .categoriaId(p.getCategoria() != null ? p.getCategoria().getId() : null)
                .categoriaNombre(p.getCategoria() != null ? p.getCategoria().getNombre() : null)
                .precioCompra(p.getPrecioCompra()).precioVenta(p.getPrecioVenta())
                .stock(p.getStock()).stockMinimo(p.getStockMinimo())
                .unidadMedida(p.getUnidadMedida()).modelo(p.getModelo())
                .tamanio(p.getTamanio()).color(p.getColor()).material(p.getMaterial())
                .codigoBarras(p.getCodigoBarras()).activo(p.getActivo())
                .stockBajo(p.getStock() <= p.getStockMinimo())
                .build();
    }
}
