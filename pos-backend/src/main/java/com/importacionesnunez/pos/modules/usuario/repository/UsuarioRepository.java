package com.importacionesnunez.pos.modules.usuario.repository;

import com.importacionesnunez.pos.modules.usuario.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, String> {
    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
}
