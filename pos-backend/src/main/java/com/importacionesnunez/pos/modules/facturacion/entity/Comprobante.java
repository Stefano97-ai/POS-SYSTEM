package com.importacionesnunez.pos.modules.facturacion.entity;

import com.importacionesnunez.pos.modules.venta.entity.Venta;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "comprobantes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Comprobante {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_id")
    private Venta venta;

    @Column(name = "tipo_comprobante", nullable = false, length = 20)
    private String tipoComprobante;

    @Column(nullable = false, length = 10)
    private String serie;

    @Column(nullable = false)
    private Integer correlativo;

    @Column(name = "numero_completo", nullable = false, length = 20)
    private String numeroCompleto;

    @Column(name = "cliente_tipo_doc", length = 10)
    private String clienteTipoDoc;

    @Column(name = "cliente_numero_doc", length = 20)
    private String clienteNumeroDoc;

    @Column(name = "cliente_nombre", length = 200)
    private String clienteNombre;

    @Column(name = "cliente_direccion", length = 300)
    private String clienteDireccion;

    @Column(name = "fecha_emision", nullable = false)
    private LocalDateTime fechaEmision;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal subtotal;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal igv;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(name = "estado_sunat", nullable = false, length = 30)
    @Builder.Default
    private String estadoSunat = "PENDIENTE";

    @Column(name = "hash_cdr", length = 500)
    private String hashCdr;

    @Column(name = "xml_contenido", columnDefinition = "TEXT")
    private String xmlContenido;

    @Column(name = "xml_firmado", columnDefinition = "TEXT")
    private String xmlFirmado;

    @Column(name = "cdr_contenido", columnDefinition = "TEXT")
    private String cdrContenido;

    @Column(name = "ticket_sunat", length = 100)
    private String ticketSunat;

    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;

    @Column(name = "mensaje_sunat", columnDefinition = "TEXT")
    private String mensajeSunat;

    @Column(name = "codigo_respuesta", length = 10)
    private String codigoRespuesta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comprobante_referencia_id")
    private Comprobante comprobanteReferencia;

    @Column(name = "motivo_nota", length = 300)
    private String motivoNota;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
