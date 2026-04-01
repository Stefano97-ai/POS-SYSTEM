package com.importacionesnunez.pos.modules.facturacion.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ComprobanteDto {
    private String id;
    private String ventaId;
    private String tipoComprobante;
    private String serie;
    private Integer correlativo;
    private String numeroCompleto;
    private String clienteTipoDoc;
    private String clienteNumeroDoc;
    private String clienteNombre;
    private String clienteDireccion;
    private LocalDateTime fechaEmision;
    private BigDecimal subtotal;
    private BigDecimal igv;
    private BigDecimal total;
    private String estadoSunat;
    private String hashCdr;
    private String mensajeSunat;
    private String codigoRespuesta;
    private String motivoNota;
    private String comprobanteReferenciaId;
    private LocalDateTime createdAt;
}
