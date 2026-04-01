package com.importacionesnunez.pos.modules.facturacion.service;

import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Servicio de integración con OSE / SUNAT.
 * Soporta:
 * - Modo MOCK (sin token/credenciales → simula respuestas para desarrollo)
 * - SUNAT Directo (SOAP con clave SOL → envía XML firmado y zipeado al Bill Service)
 * - Nubefact (REST API → envía JSON al API de Nubefact)
 * - Otros OSE (extensible)
 */
@Service
@Slf4j
public class OseIntegrationService {

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    // URLs por defecto de SUNAT
    private static final String SUNAT_BETA_URL = "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService";
    private static final String SUNAT_PROD_URL = "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService";

    // =================== ENVIAR COMPROBANTE ===================

    public Map<String, String> enviarComprobante(Comprobante comprobante, String xmlFirmado, ConfiguracionEmpresa config) {
        String provider = config.getOseProvider();

        // Si no hay credenciales configuradas → modo mock
        if (isMockMode(config)) {
            return mockEnvio(comprobante);
        }

        return switch (provider != null ? provider.toUpperCase() : "SUNAT") {
            case "NUBEFACT" -> enviarNubefact(comprobante, config);
            case "EBIS", "EFACT", "CUSTOM" -> enviarOseGenerico(comprobante, xmlFirmado, config);
            default -> enviarSunatDirecto(comprobante, xmlFirmado, config);
        };
    }

    // =================== SUNAT DIRECTO (SOAP) ===================

    private Map<String, String> enviarSunatDirecto(Comprobante comprobante, String xmlFirmado, ConfiguracionEmpresa config) {
        Map<String, String> resultado = new HashMap<>();

        try {
            String url = resolverUrlSunat(config);
            String ruc = config.getRuc();
            String usuario = config.getOseUsuarioSol();
            String clave = config.getOseClaveSol();

            if (usuario == null || clave == null) {
                resultado.put("estadoSunat", "ERROR");
                resultado.put("codigoRespuesta", "9998");
                resultado.put("mensajeSunat", "Credenciales SOL no configuradas");
                return resultado;
            }

            // Nombre del archivo ZIP: RUC-TIPO-SERIE-CORRELATIVO.zip
            String tipoDoc = mapTipoDocumento(comprobante.getTipoComprobante());
            String fileName = ruc + "-" + tipoDoc + "-" + comprobante.getNumeroCompleto();

            // Zipear el XML firmado
            byte[] zipBytes = zipXml(fileName + ".xml", xmlFirmado);
            String zipBase64 = Base64.getEncoder().encodeToString(zipBytes);

            // Construir el SOAP envelope
            String soapEnvelope = buildSoapEnvelope(fileName + ".zip", zipBase64);

            // Credencial SUNAT: RUC + usuario SOL
            String credentials = ruc + usuario + ":" + clave;
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            // Enviar al SOAP endpoint
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "text/xml; charset=utf-8")
                    .header("SOAPAction", "urn:sendBill")
                    .header("Authorization", authHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(soapEnvelope))
                    .build();

            log.info("Enviando comprobante {} a SUNAT: {}", comprobante.getNumeroCompleto(), url);
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            // Parsear respuesta SOAP
            return parseSoapResponse(response.body(), response.statusCode());

        } catch (Exception e) {
            log.error("Error enviando a SUNAT: {}", e.getMessage(), e);
            resultado.put("estadoSunat", "ERROR");
            resultado.put("codigoRespuesta", "9999");
            resultado.put("mensajeSunat", "Error de comunicación con SUNAT: " + e.getMessage());
            return resultado;
        }
    }

    // =================== NUBEFACT (REST) ===================

    private Map<String, String> enviarNubefact(Comprobante comprobante, ConfiguracionEmpresa config) {
        Map<String, String> resultado = new HashMap<>();

        try {
            String url = config.getOseApiUrl();
            String token = config.getOseApiToken();

            if (url == null || token == null || token.isBlank()) {
                resultado.put("estadoSunat", "ERROR");
                resultado.put("codigoRespuesta", "9998");
                resultado.put("mensajeSunat", "Token de Nubefact no configurado");
                return resultado;
            }

            // Construir JSON para Nubefact
            String json = buildNubefactJson(comprobante, config);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + token)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();

            log.info("Enviando comprobante {} a Nubefact", comprobante.getNumeroCompleto());
            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            return parseNubefactResponse(response.body(), response.statusCode());

        } catch (Exception e) {
            log.error("Error enviando a Nubefact: {}", e.getMessage(), e);
            resultado.put("estadoSunat", "ERROR");
            resultado.put("codigoRespuesta", "9999");
            resultado.put("mensajeSunat", "Error de comunicación con Nubefact: " + e.getMessage());
            return resultado;
        }
    }

    // =================== OSE GENÉRICO ===================

    private Map<String, String> enviarOseGenerico(Comprobante comprobante, String xmlFirmado, ConfiguracionEmpresa config) {
        Map<String, String> resultado = new HashMap<>();

        try {
            String url = config.getOseApiUrl();
            String token = config.getOseApiToken();

            if (url == null || url.isBlank()) {
                resultado.put("estadoSunat", "ERROR");
                resultado.put("codigoRespuesta", "9998");
                resultado.put("mensajeSunat", "URL del OSE no configurada");
                return resultado;
            }

            // Enviar XML firmado directamente (protocolo genérico)
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/xml")
                    .POST(HttpRequest.BodyPublishers.ofString(xmlFirmado, StandardCharsets.UTF_8));

            if (token != null && !token.isBlank()) {
                builder.header("Authorization", "Bearer " + token);
            }

            HttpResponse<String> response = HTTP_CLIENT.send(builder.build(), HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                resultado.put("estadoSunat", "ACEPTADO");
                resultado.put("codigoRespuesta", "0");
                resultado.put("mensajeSunat", "Procesado por " + config.getOseProvider());
                resultado.put("hashCdr", "CDR-" + System.currentTimeMillis());
            } else {
                resultado.put("estadoSunat", "ERROR");
                resultado.put("codigoRespuesta", String.valueOf(response.statusCode()));
                resultado.put("mensajeSunat", response.body());
            }

        } catch (Exception e) {
            log.error("Error enviando a OSE {}: {}", config.getOseProvider(), e.getMessage());
            resultado.put("estadoSunat", "ERROR");
            resultado.put("codigoRespuesta", "9999");
            resultado.put("mensajeSunat", "Error: " + e.getMessage());
        }
        return resultado;
    }

    // =================== COMUNICACIÓN DE BAJA ===================

    public Map<String, String> enviarComunicacionBaja(String xmlFirmado, ConfiguracionEmpresa config) {
        if (isMockMode(config)) {
            Map<String, String> resultado = new HashMap<>();
            log.info("OSE Mock: Comunicación de baja enviada (modo desarrollo)");
            resultado.put("estadoSunat", "ACEPTADO");
            resultado.put("mensajeSunat", "Comunicación de baja procesada (mock)");
            resultado.put("ticket", "TICKET-MOCK-" + System.currentTimeMillis());
            return resultado;
        }

        // Para SUNAT directo, enviar vía SOAP con SOAPAction urn:sendSummary
        return enviarSummarySunat(xmlFirmado, config, "urn:sendSummary");
    }

    // =================== RESUMEN DIARIO ===================

    public Map<String, String> enviarResumenDiario(String xmlFirmado, ConfiguracionEmpresa config) {
        if (isMockMode(config)) {
            Map<String, String> resultado = new HashMap<>();
            log.info("OSE Mock: Resumen diario enviado (modo desarrollo)");
            resultado.put("estadoSunat", "ACEPTADO");
            resultado.put("ticket", "TICKET-MOCK-" + System.currentTimeMillis());
            resultado.put("mensajeSunat", "Resumen diario procesado (mock)");
            return resultado;
        }

        return enviarSummarySunat(xmlFirmado, config, "urn:sendSummary");
    }

    // =================== CONSULTA ESTADO (Ticket) ===================

    public Map<String, String> consultarTicket(String ticket, ConfiguracionEmpresa config) {
        Map<String, String> resultado = new HashMap<>();

        if (isMockMode(config)) {
            resultado.put("estadoSunat", "ACEPTADO");
            resultado.put("codigoRespuesta", "0");
            resultado.put("mensajeSunat", "Procesado exitosamente (mock)");
            return resultado;
        }

        try {
            String url = resolverUrlSunat(config);
            String ruc = config.getRuc();
            String usuario = config.getOseUsuarioSol();
            String clave = config.getOseClaveSol();

            String soapEnvelope = buildGetStatusSoapEnvelope(ticket);
            String credentials = ruc + usuario + ":" + clave;
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "text/xml; charset=utf-8")
                    .header("SOAPAction", "urn:getStatus")
                    .header("Authorization", authHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(soapEnvelope))
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());
            return parseSoapResponse(response.body(), response.statusCode());

        } catch (Exception e) {
            resultado.put("estadoSunat", "ERROR");
            resultado.put("mensajeSunat", "Error consultando ticket: " + e.getMessage());
        }
        return resultado;
    }

    // =================== HELPERS PRIVADOS ===================

    private boolean isMockMode(ConfiguracionEmpresa config) {
        boolean noSunatCreds = (config.getOseUsuarioSol() == null || config.getOseUsuarioSol().isBlank())
                && (config.getOseApiToken() == null || config.getOseApiToken().isBlank());
        return noSunatCreds;
    }

    private Map<String, String> mockEnvio(Comprobante comprobante) {
        Map<String, String> resultado = new HashMap<>();

        // Simular latencia de red
        try { Thread.sleep(300 + (long)(Math.random() * 400)); } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }

        log.info("OSE Mock: Comprobante {} enviado (modo desarrollo)", comprobante.getNumeroCompleto());

        // Simular RECHAZO si el RUC cliente es un test case
        if ("11111111111".equals(comprobante.getClienteNumeroDoc())) {
            resultado.put("estadoSunat", "RECHAZADO");
            resultado.put("codigoRespuesta", "2017");
            resultado.put("mensajeSunat", "El número de RUC del receptor no existe");
            return resultado;
        }

        resultado.put("estadoSunat", "ACEPTADO");
        resultado.put("codigoRespuesta", "0");
        resultado.put("mensajeSunat", "La " + comprobante.getTipoComprobante() + " " + comprobante.getNumeroCompleto() + " ha sido aceptada.");
        resultado.put("hashCdr", "MOCK-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        return resultado;
    }

    private String resolverUrlSunat(ConfiguracionEmpresa config) {
        boolean isBeta = "BETA".equalsIgnoreCase(config.getOseMode());
        if (isBeta) {
            return config.getOseApiUrlBeta() != null && !config.getOseApiUrlBeta().isBlank()
                    ? config.getOseApiUrlBeta() : SUNAT_BETA_URL;
        }
        return config.getOseApiUrl() != null && !config.getOseApiUrl().isBlank()
                ? config.getOseApiUrl() : SUNAT_PROD_URL;
    }

    private byte[] zipXml(String fileName, String xmlContent) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            ZipEntry entry = new ZipEntry(fileName);
            zos.putNextEntry(entry);
            zos.write(xmlContent.getBytes(StandardCharsets.UTF_8));
            zos.closeEntry();
        }
        return baos.toByteArray();
    }

    private String buildSoapEnvelope(String fileName, String contentBase64) {
        return """
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe">
                  <soapenv:Header/>
                  <soapenv:Body>
                    <ser:sendBill>
                      <fileName>%s</fileName>
                      <contentFile>%s</contentFile>
                    </ser:sendBill>
                  </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(fileName, contentBase64);
    }

    private String buildGetStatusSoapEnvelope(String ticket) {
        return """
                <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:ser="http://service.sunat.gob.pe">
                  <soapenv:Header/>
                  <soapenv:Body>
                    <ser:getStatus>
                      <ticket>%s</ticket>
                    </ser:getStatus>
                  </soapenv:Body>
                </soapenv:Envelope>
                """.formatted(ticket);
    }

    private Map<String, String> enviarSummarySunat(String xmlFirmado, ConfiguracionEmpresa config, String soapAction) {
        Map<String, String> resultado = new HashMap<>();
        try {
            String url = resolverUrlSunat(config);
            String ruc = config.getRuc();
            String fileName = ruc + "-" + System.currentTimeMillis();
            byte[] zipBytes = zipXml(fileName + ".xml", xmlFirmado);
            String zipBase64 = Base64.getEncoder().encodeToString(zipBytes);

            String soapEnvelope = """
                    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                      xmlns:ser="http://service.sunat.gob.pe">
                      <soapenv:Header/>
                      <soapenv:Body>
                        <ser:sendSummary>
                          <fileName>%s.zip</fileName>
                          <contentFile>%s</contentFile>
                        </ser:sendSummary>
                      </soapenv:Body>
                    </soapenv:Envelope>
                    """.formatted(fileName, zipBase64);

            String credentials = ruc + config.getOseUsuarioSol() + ":" + config.getOseClaveSol();
            String authHeader = "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "text/xml; charset=utf-8")
                    .header("SOAPAction", soapAction)
                    .header("Authorization", authHeader)
                    .POST(HttpRequest.BodyPublishers.ofString(soapEnvelope))
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                String body = response.body();
                // Extraer ticket del response
                String ticket = extractTag(body, "ticket");
                resultado.put("estadoSunat", "ACEPTADO");
                resultado.put("ticket", ticket != null ? ticket : "");
                resultado.put("mensajeSunat", "Enviado correctamente");
            } else {
                resultado.put("estadoSunat", "ERROR");
                resultado.put("mensajeSunat", "HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            resultado.put("estadoSunat", "ERROR");
            resultado.put("mensajeSunat", "Error: " + e.getMessage());
        }
        return resultado;
    }

    private Map<String, String> parseSoapResponse(String soapBody, int statusCode) {
        Map<String, String> resultado = new HashMap<>();

        if (statusCode >= 200 && statusCode < 300) {
            // Extraer applicationResponse (CDR en base64)
            String cdrBase64 = extractTag(soapBody, "applicationResponse");
            String faultCode = extractTag(soapBody, "faultcode");
            String faultString = extractTag(soapBody, "faultstring");

            if (faultCode != null) {
                resultado.put("estadoSunat", "RECHAZADO");
                resultado.put("codigoRespuesta", faultCode);
                resultado.put("mensajeSunat", faultString != null ? faultString : "Error SUNAT");
            } else {
                resultado.put("estadoSunat", "ACEPTADO");
                resultado.put("codigoRespuesta", "0");
                resultado.put("mensajeSunat", "Comprobante aceptado por SUNAT");
                if (cdrBase64 != null) {
                    resultado.put("cdrBase64", cdrBase64);
                    resultado.put("hashCdr", "CDR-" + cdrBase64.substring(0, Math.min(20, cdrBase64.length())));
                }
            }
        } else {
            resultado.put("estadoSunat", "ERROR");
            resultado.put("codigoRespuesta", String.valueOf(statusCode));
            resultado.put("mensajeSunat", "HTTP " + statusCode + ": " + soapBody.substring(0, Math.min(200, soapBody.length())));
        }
        return resultado;
    }

    private Map<String, String> parseNubefactResponse(String body, int statusCode) {
        Map<String, String> resultado = new HashMap<>();

        if (statusCode >= 200 && statusCode < 300) {
            // Nubefact retorna JSON con campos: sunat_description, sunat_note, sunat_responsecode, etc.
            resultado.put("estadoSunat", "ACEPTADO");
            resultado.put("codigoRespuesta", "0");
            String desc = extractJsonField(body, "sunat_description");
            resultado.put("mensajeSunat", desc != null ? desc : "Procesado por Nubefact");
            String hash = extractJsonField(body, "hash_cdr");
            if (hash != null) resultado.put("hashCdr", hash);
            String pdfUrl = extractJsonField(body, "enlace_del_pdf");
            if (pdfUrl != null) resultado.put("pdfUrl", pdfUrl);
        } else {
            resultado.put("estadoSunat", "ERROR");
            resultado.put("codigoRespuesta", String.valueOf(statusCode));
            String error = extractJsonField(body, "errors");
            resultado.put("mensajeSunat", error != null ? error : body.substring(0, Math.min(200, body.length())));
        }
        return resultado;
    }

    private String buildNubefactJson(Comprobante comprobante, ConfiguracionEmpresa config) {
        String tipoDoc = switch (comprobante.getTipoComprobante()) {
            case "FACTURA" -> "1";
            case "BOLETA" -> "2";
            case "NOTA_CREDITO" -> "3";
            case "NOTA_DEBITO" -> "4";
            default -> "2";
        };

        String tipoDocCliente = switch (comprobante.getClienteTipoDoc() != null ? comprobante.getClienteTipoDoc() : "") {
            case "RUC" -> "6";
            case "DNI" -> "1";
            default -> "-";
        };

        // Construir JSON básico (los items se simplifican ya que Nubefact los calcula)
        return """
                {
                  "operacion": "generar_comprobante",
                  "tipo_de_comprobante": %s,
                  "serie": "%s",
                  "numero": %d,
                  "sunat_transaction": 1,
                  "cliente_tipo_de_documento": "%s",
                  "cliente_numero_de_documento": "%s",
                  "cliente_denominacion": "%s",
                  "cliente_direccion": "%s",
                  "moneda": 1,
                  "total_gravada": %s,
                  "total_igv": %s,
                  "total": %s
                }
                """.formatted(
                tipoDoc,
                comprobante.getSerie(),
                comprobante.getCorrelativo(),
                tipoDocCliente,
                comprobante.getClienteNumeroDoc() != null ? comprobante.getClienteNumeroDoc() : "",
                comprobante.getClienteNombre() != null ? comprobante.getClienteNombre().replace("\"", "\\\"") : "",
                comprobante.getClienteDireccion() != null ? comprobante.getClienteDireccion().replace("\"", "\\\"") : "",
                comprobante.getSubtotal().toPlainString(),
                comprobante.getIgv().toPlainString(),
                comprobante.getTotal().toPlainString()
        );
    }

    private String extractTag(String xml, String tagName) {
        int start = xml.indexOf("<" + tagName + ">");
        if (start == -1) {
            start = xml.indexOf("<" + tagName + " ");
            if (start == -1) return null;
            start = xml.indexOf(">", start) + 1;
        } else {
            start += tagName.length() + 2;
        }
        int end = xml.indexOf("</" + tagName + ">", start);
        if (end == -1) return null;
        return xml.substring(start, end).trim();
    }

    private String extractJsonField(String json, String field) {
        String key = "\"" + field + "\"";
        int idx = json.indexOf(key);
        if (idx == -1) return null;
        int colon = json.indexOf(":", idx);
        if (colon == -1) return null;
        int valStart = json.indexOf("\"", colon + 1);
        if (valStart == -1) return null;
        int valEnd = json.indexOf("\"", valStart + 1);
        if (valEnd == -1) return null;
        return json.substring(valStart + 1, valEnd);
    }

    private String mapTipoDocumento(String tipo) {
        return switch (tipo) {
            case "FACTURA" -> "01";
            case "BOLETA" -> "03";
            case "NOTA_CREDITO" -> "07";
            case "NOTA_DEBITO" -> "08";
            default -> "01";
        };
    }
}
