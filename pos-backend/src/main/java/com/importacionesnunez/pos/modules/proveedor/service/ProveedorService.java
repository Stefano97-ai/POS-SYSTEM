package com.importacionesnunez.pos.modules.proveedor.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.producto.entity.Producto;
import com.importacionesnunez.pos.modules.producto.repository.ProductoRepository;
import com.importacionesnunez.pos.modules.proveedor.dto.CreateProveedorRequest;
import com.importacionesnunez.pos.modules.proveedor.dto.ProveedorDto;
import com.importacionesnunez.pos.modules.proveedor.entity.Proveedor;
import com.importacionesnunez.pos.modules.proveedor.repository.ProveedorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;
    private final ProductoRepository productoRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<ProveedorDto> listar() {
        return proveedorRepository.findByActivoTrue().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProveedorDto obtenerPorId(String id) {
        return toDto(findById(id));
    }

    @Transactional
    public ProveedorDto crear(CreateProveedorRequest req) {
        Proveedor p = Proveedor.builder()
                .ruc(req.getRuc()).nombre(req.getNombre()).contacto(req.getContacto())
                .telefono(req.getTelefono()).email(req.getEmail())
                .direccion(req.getDireccion()).notas(req.getNotas()).build();

        if (req.getProductoIds() != null && !req.getProductoIds().isEmpty()) {
            Set<Producto> productos = new HashSet<>(productoRepository.findAllById(req.getProductoIds()));
            p.setProductos(productos);
        }

        p = proveedorRepository.save(p);
        auditService.registrar("CREAR", "PROVEEDOR", p.getId(), "Creado: " + p.getNombre());
        return toDto(p);
    }

    @Transactional
    public ProveedorDto actualizar(String id, CreateProveedorRequest req) {
        Proveedor p = findById(id);
        p.setRuc(req.getRuc());
        p.setNombre(req.getNombre());
        p.setContacto(req.getContacto());
        p.setTelefono(req.getTelefono());
        p.setEmail(req.getEmail());
        p.setDireccion(req.getDireccion());
        p.setNotas(req.getNotas());

        if (req.getProductoIds() != null) {
            Set<Producto> productos = new HashSet<>(productoRepository.findAllById(req.getProductoIds()));
            p.setProductos(productos);
        }

        p = proveedorRepository.save(p);
        auditService.registrar("ACTUALIZAR", "PROVEEDOR", p.getId(), "Actualizado: " + p.getNombre());
        return toDto(p);
    }

    @Transactional
    public void desactivar(String id) {
        Proveedor p = findById(id);
        p.setActivo(false);
        proveedorRepository.save(p);
        auditService.registrar("DESACTIVAR", "PROVEEDOR", id, "Desactivado: " + p.getNombre());
    }

    private Proveedor findById(String id) {
        return proveedorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Proveedor", "id", id));
    }

    private ProveedorDto toDto(Proveedor p) {
        return ProveedorDto.builder()
                .id(p.getId()).ruc(p.getRuc()).nombre(p.getNombre()).contacto(p.getContacto())
                .telefono(p.getTelefono()).email(p.getEmail()).direccion(p.getDireccion())
                .notas(p.getNotas()).activo(p.getActivo())
                .productoIds(p.getProductos().stream().map(Producto::getId).toList())
                .build();
    }
}
