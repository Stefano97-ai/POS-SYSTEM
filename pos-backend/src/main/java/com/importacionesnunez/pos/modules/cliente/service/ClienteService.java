package com.importacionesnunez.pos.modules.cliente.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.cliente.dto.ClienteDto;
import com.importacionesnunez.pos.modules.cliente.dto.CreateClienteRequest;
import com.importacionesnunez.pos.modules.cliente.entity.Cliente;
import com.importacionesnunez.pos.modules.cliente.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final AuditService auditService;

    public Page<ClienteDto> listar(Pageable pageable) {
        return clienteRepository.findByActivoTrue(pageable).map(this::toDto);
    }

    public ClienteDto obtenerPorId(String id) {
        return toDto(findById(id));
    }

    public List<ClienteDto> buscar(String query) {
        return clienteRepository.buscar(query).stream().map(this::toDto).toList();
    }

    @Transactional
    public ClienteDto crear(CreateClienteRequest req) {
        Cliente c = Cliente.builder()
                .tipoDocumento(req.getTipoDocumento()).numeroDocumento(req.getNumeroDocumento())
                .tipoCliente(req.getTipoCliente()).nombre(req.getNombre())
                .razonSocial(req.getRazonSocial()).direccion(req.getDireccion())
                .telefono(req.getTelefono()).email(req.getEmail())
                .clasificacion(req.getClasificacion()).notas(req.getNotas())
                .build();
        c = clienteRepository.save(c);
        auditService.registrar("CREAR", "CLIENTE", c.getId(), "Creado: " + c.getNombre());
        return toDto(c);
    }

    @Transactional
    public ClienteDto actualizar(String id, CreateClienteRequest req) {
        Cliente c = findById(id);
        c.setTipoDocumento(req.getTipoDocumento());
        c.setNumeroDocumento(req.getNumeroDocumento());
        c.setTipoCliente(req.getTipoCliente());
        c.setNombre(req.getNombre());
        c.setRazonSocial(req.getRazonSocial());
        c.setDireccion(req.getDireccion());
        c.setTelefono(req.getTelefono());
        c.setEmail(req.getEmail());
        c.setClasificacion(req.getClasificacion());
        c.setNotas(req.getNotas());
        c = clienteRepository.save(c);
        auditService.registrar("ACTUALIZAR", "CLIENTE", c.getId(), "Actualizado: " + c.getNombre());
        return toDto(c);
    }

    @Transactional
    public void desactivar(String id) {
        Cliente c = findById(id);
        c.setActivo(false);
        clienteRepository.save(c);
        auditService.registrar("DESACTIVAR", "CLIENTE", id, "Desactivado: " + c.getNombre());
    }

    @Transactional
    public void agregarCompra(String id, BigDecimal monto) {
        Cliente c = findById(id);
        c.setTotalCompras(c.getTotalCompras().add(monto));
        clienteRepository.save(c);
    }

    public Cliente findById(String id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente", "id", id));
    }

    public ClienteDto toDto(Cliente c) {
        return ClienteDto.builder()
                .id(c.getId()).tipoDocumento(c.getTipoDocumento())
                .numeroDocumento(c.getNumeroDocumento()).tipoCliente(c.getTipoCliente())
                .nombre(c.getNombre()).razonSocial(c.getRazonSocial())
                .direccion(c.getDireccion()).telefono(c.getTelefono()).email(c.getEmail())
                .clasificacion(c.getClasificacion()).notas(c.getNotas())
                .totalCompras(c.getTotalCompras()).activo(c.getActivo()).build();
    }
}
