package com.importacionesnunez.pos.config;

import com.importacionesnunez.pos.modules.usuario.entity.Rol;
import com.importacionesnunez.pos.modules.usuario.entity.Usuario;
import com.importacionesnunez.pos.modules.usuario.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (usuarioRepository.count() == 0) {
            Usuario admin = Usuario.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .nombreCompleto("Jesús Alberto Nuñez Quiñonez")
                    .email("jesucito2443@hotmail.com")
                    .rol(Rol.ROLE_ADMIN)
                    .build();
            usuarioRepository.save(admin);

            Usuario vendedor = Usuario.builder()
                    .username("vendedor")
                    .password(passwordEncoder.encode("vendedor123"))
                    .nombreCompleto("Vendedor Importaciones Nuñez")
                    .rol(Rol.ROLE_VENDEDOR)
                    .build();
            usuarioRepository.save(vendedor);

            Usuario consulta = Usuario.builder()
                    .username("consulta")
                    .password(passwordEncoder.encode("consulta123"))
                    .nombreCompleto("Usuario Consulta")
                    .rol(Rol.ROLE_CONSULTA)
                    .build();
            usuarioRepository.save(consulta);

            log.info("========================================");
            log.info("Usuarios creados:");
            log.info("  Admin:    admin / admin123");
            log.info("  Vendedor: vendedor / vendedor123");
            log.info("  Consulta: consulta / consulta123");
            log.info("========================================");
        }
    }
}
