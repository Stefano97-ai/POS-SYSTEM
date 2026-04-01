package com.importacionesnunez.pos.modules.usuario.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.BusinessException;
import com.importacionesnunez.pos.common.exception.ResourceNotFoundException;
import com.importacionesnunez.pos.modules.usuario.dto.CreateUsuarioRequest;
import com.importacionesnunez.pos.modules.usuario.dto.UpdateUsuarioRequest;
import com.importacionesnunez.pos.modules.usuario.dto.UsuarioDto;
import com.importacionesnunez.pos.modules.usuario.entity.Rol;
import com.importacionesnunez.pos.modules.usuario.entity.Usuario;
import com.importacionesnunez.pos.modules.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public List<UsuarioDto> listarTodos() {
        return usuarioRepository.findAll().stream().map(this::toDto).toList();
    }

    public UsuarioDto obtenerPorId(String id) {
        return toDto(findById(id));
    }

    @Transactional
    public UsuarioDto crear(CreateUsuarioRequest request) {
        if (usuarioRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("El nombre de usuario ya existe: " + request.getUsername());
        }

        Usuario usuario = Usuario.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .nombreCompleto(request.getNombreCompleto())
                .email(request.getEmail())
                .rol(Rol.valueOf(request.getRol()))
                .build();

        usuario = usuarioRepository.save(usuario);
        auditService.registrar("CREAR", "USUARIO", usuario.getId(), "Creado usuario: " + usuario.getUsername());
        return toDto(usuario);
    }

    @Transactional
    public UsuarioDto actualizar(String id, UpdateUsuarioRequest request) {
        Usuario usuario = findById(id);

        if (request.getNombreCompleto() != null) usuario.setNombreCompleto(request.getNombreCompleto());
        if (request.getEmail() != null) usuario.setEmail(request.getEmail());
        if (request.getRol() != null) usuario.setRol(Rol.valueOf(request.getRol()));
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        usuario = usuarioRepository.save(usuario);
        auditService.registrar("ACTUALIZAR", "USUARIO", usuario.getId(), "Actualizado usuario: " + usuario.getUsername());
        return toDto(usuario);
    }

    @Transactional
    public void desactivar(String id) {
        Usuario usuario = findById(id);
        usuario.setActivo(false);
        usuarioRepository.save(usuario);
        auditService.registrar("DESACTIVAR", "USUARIO", id, "Desactivado usuario: " + usuario.getUsername());
    }

    private Usuario findById(String id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario", "id", id));
    }

    private UsuarioDto toDto(Usuario u) {
        return UsuarioDto.builder()
                .id(u.getId()).username(u.getUsername())
                .nombreCompleto(u.getNombreCompleto()).email(u.getEmail())
                .rol(u.getRol().name()).activo(u.getActivo())
                .createdAt(u.getCreatedAt()).build();
    }
}
