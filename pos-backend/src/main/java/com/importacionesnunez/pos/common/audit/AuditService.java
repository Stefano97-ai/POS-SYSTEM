package com.importacionesnunez.pos.common.audit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void registrar(String accion, String entidad, String entidadId, String detalle) {
        String usuario = getUsuarioActual();
        String ip = getClientIp();

        AuditLog log = AuditLog.builder()
                .usuario(usuario)
                .accion(accion)
                .entidad(entidad)
                .entidadId(entidadId)
                .detalle(detalle)
                .ip(ip)
                .build();
        auditLogRepository.save(log);
    }

    private String getUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return "ANONYMOUS";
        return auth.getName();
    }

    private String getClientIp() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xff = request.getHeader("X-Forwarded-For");
                return xff != null ? xff.split(",")[0].trim() : request.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return "unknown";
    }
}
