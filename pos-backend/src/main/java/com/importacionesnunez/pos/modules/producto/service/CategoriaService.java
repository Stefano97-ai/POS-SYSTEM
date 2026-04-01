package com.importacionesnunez.pos.modules.producto.service;

import com.importacionesnunez.pos.common.exception.BusinessException;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.producto.entity.Categoria;
import com.importacionesnunez.pos.modules.producto.repository.CategoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public List<Categoria> listarActivas() {
        return categoriaRepository.findByActivaTrue();
    }

    public List<Categoria> listarTodas() {
        return categoriaRepository.findAll();
    }

    public Categoria crear(String nombre, String descripcion) {
        if (categoriaRepository.existsByNombre(nombre)) {
            throw new BusinessException("Ya existe una categoría con el nombre: " + nombre);
        }
        Categoria cat = Categoria.builder().nombre(nombre).descripcion(descripcion).build();
        return categoriaRepository.save(cat);
    }

    public Categoria actualizar(String id, String nombre, String descripcion) {
        Categoria cat = categoriaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Categoría", "id", id));
        if (nombre != null) cat.setNombre(nombre);
        if (descripcion != null) cat.setDescripcion(descripcion);
        return categoriaRepository.save(cat);
    }
}
