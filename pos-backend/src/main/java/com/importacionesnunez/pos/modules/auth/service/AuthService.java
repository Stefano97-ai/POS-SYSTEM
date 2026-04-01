package com.importacionesnunez.pos.modules.auth.service;

import com.importacionesnunez.pos.common.audit.AuditService;
import com.importacionesnunez.pos.common.exception.BusinessException;
import com.importacionesnunez.pos.modules.auth.dto.LoginRequest;
import com.importacionesnunez.pos.modules.auth.dto.LoginResponse;
import com.importacionesnunez.pos.modules.auth.dto.RefreshTokenRequest;
import com.importacionesnunez.pos.modules.auth.entity.RefreshToken;
import com.importacionesnunez.pos.modules.auth.repository.RefreshTokenRepository;
import com.importacionesnunez.pos.modules.usuario.entity.Usuario;
import com.importacionesnunez.pos.modules.usuario.repository.UsuarioRepository;
import com.importacionesnunez.pos.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final UsuarioRepository usuarioRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AuditService auditService;

    @Value("${app.jwt.refresh-token-expiration}")
    private long refreshTokenExpiration;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
        Usuario usuario = usuarioRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        String accessToken = jwtTokenProvider.generateAccessToken(userDetails);
        String refreshTokenStr = jwtTokenProvider.generateRefreshToken(request.getUsername());

        // Eliminar refresh tokens anteriores del usuario
        refreshTokenRepository.deleteByUsername(request.getUsername());

        // Crear nuevo refresh token
        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenStr)
                .username(request.getUsername())
                .expiryDate(LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000))
                .build();
        refreshTokenRepository.save(refreshToken);

        auditService.registrar("LOGIN", "USUARIO", usuario.getId(), "Login exitoso");

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .role(usuario.getRol().name())
                .build();
    }

    @Transactional
    public LoginResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BusinessException("Refresh token inválido"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new BusinessException("Refresh token expirado. Inicie sesión nuevamente.");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(refreshToken.getUsername());
        String newAccessToken = jwtTokenProvider.generateAccessToken(userDetails);

        Usuario usuario = usuarioRepository.findByUsername(refreshToken.getUsername())
                .orElseThrow(() -> new BusinessException("Usuario no encontrado"));

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .username(usuario.getUsername())
                .nombreCompleto(usuario.getNombreCompleto())
                .role(usuario.getRol().name())
                .build();
    }

    @Transactional
    public void logout(String username) {
        refreshTokenRepository.deleteByUsername(username);
        auditService.registrar("LOGOUT", "USUARIO", null, "Logout: " + username);
    }
}
