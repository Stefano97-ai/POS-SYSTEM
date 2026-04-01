package com.importacionesnunez.pos.modules.facturacion.service;

import com.importacionesnunez.pos.common.utils.NumberToWords;
import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import com.importacionesnunez.pos.modules.venta.entity.DetalleVenta;
import com.importacionesnunez.pos.modules.venta.entity.Venta;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Generador de XML UBL 2.1 para comprobantes electrónicos SUNAT.
 * Soporta: Invoice (Factura/Boleta), CreditNote, DebitNote, ResumenDiario, ComunicacionBaja.
 */
@Service
public class XmlGeneratorService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss");

    // =================== INVOICE / CREDIT NOTE / DEBIT NOTE ===================

    public String generarXml(Comprobante comprobante, Venta venta, ConfiguracionEmpresa config) {
        boolean isCreditNote = "NOTA_CREDITO".equals(comprobante.getTipoComprobante());
        boolean isDebitNote = "NOTA_DEBITO".equals(comprobante.getTipoComprobante());

        String rootTag;
        String mainNamespace;

        if (isCreditNote) {
            rootTag = "CreditNote";
            mainNamespace = "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2";
        } else if (isDebitNote) {
            rootTag = "DebitNote";
            mainNamespace = "urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2";
        } else {
            rootTag = "Invoice";
            mainNamespace = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2";
        }

        String tipoDoc = mapTipoDocumento(comprobante.getTipoComprobante());
        String tipoDocCliente = mapTipoDocCliente(comprobante.getClienteTipoDoc());

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<").append(rootTag).append(" xmlns=\"").append(mainNamespace).append("\"\n");
        xml.append("  xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"\n");
        xml.append("  xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\"\n");
        xml.append("  xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"\n");
        xml.append("  xmlns:ext=\"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2\">\n");

        // UBL Extensions (placeholder para firma digital)
        xml.append("  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>\n");

        xml.append("  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>\n");
        xml.append("  <cbc:CustomizationID>2.0</cbc:CustomizationID>\n");
        xml.append("  <cbc:ProfileID>2.0</cbc:ProfileID>\n");
        xml.append("  <cbc:ID>").append(comprobante.getNumeroCompleto()).append("</cbc:ID>\n");
        xml.append("  <cbc:IssueDate>").append(comprobante.getFechaEmision().format(DATE_FMT)).append("</cbc:IssueDate>\n");
        xml.append("  <cbc:IssueTime>").append(comprobante.getFechaEmision().format(TIME_FMT)).append("</cbc:IssueTime>\n");

        if (!isCreditNote && !isDebitNote) {
            xml.append("  <cbc:InvoiceTypeCode listID=\"0101\">").append(tipoDoc).append("</cbc:InvoiceTypeCode>\n");
        } else if (isCreditNote) {
            xml.append("  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>\n");
        } else {
            xml.append("  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>\n");
        }

        if (!isCreditNote && !isDebitNote) {
            xml.append("  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>\n");
        }

        // Leyenda: Monto en letras
        String montoLetras = NumberToWords.convert(comprobante.getTotal(), "SOLES");
        xml.append("  <cbc:Note languageLocaleID=\"1000\"><![CDATA[").append(montoLetras).append("]]></cbc:Note>\n");

        // Notas de crédito / débito: referencia al documento original
        if ((isCreditNote || isDebitNote) && comprobante.getComprobanteReferencia() != null) {
            xml.append("  <cac:DiscrepancyResponse>\n");
            xml.append("    <cbc:ReferenceID>").append(comprobante.getComprobanteReferencia().getNumeroCompleto()).append("</cbc:ReferenceID>\n");
            xml.append("    <cbc:ResponseCode>").append(mapMotivoNota(comprobante.getMotivoNota(), isDebitNote)).append("</cbc:ResponseCode>\n");
            xml.append("    <cbc:Description><![CDATA[").append(comprobante.getMotivoNota()).append("]]></cbc:Description>\n");
            xml.append("  </cac:DiscrepancyResponse>\n");

            xml.append("  <cac:BillingReference>\n");
            xml.append("    <cac:InvoiceDocumentReference>\n");
            xml.append("      <cbc:ID>").append(comprobante.getComprobanteReferencia().getNumeroCompleto()).append("</cbc:ID>\n");
            xml.append("      <cbc:DocumentTypeCode>").append(mapTipoDocumento(comprobante.getComprobanteReferencia().getTipoComprobante())).append("</cbc:DocumentTypeCode>\n");
            xml.append("    </cac:InvoiceDocumentReference>\n");
            xml.append("  </cac:BillingReference>\n");
        }

        // Forma de pago (Contado)
        if (!isCreditNote && !isDebitNote) {
            xml.append("  <cac:PaymentTerms>\n");
            xml.append("    <cbc:ID>FormaPago</cbc:ID>\n");
            xml.append("    <cbc:PaymentMeansID>Contado</cbc:PaymentMeansID>\n");
            xml.append("  </cac:PaymentTerms>\n");
        }

        // Emisor (Supplier)
        xml.append("  <cac:AccountingSupplierParty>\n");
        xml.append("    <cac:Party>\n");
        xml.append("      <cac:PartyIdentification><cbc:ID schemeID=\"6\">").append(config.getRuc()).append("</cbc:ID></cac:PartyIdentification>\n");
        xml.append("      <cac:PartyName><cbc:Name><![CDATA[").append(config.getNombreComercial() != null ? config.getNombreComercial() : config.getRazonSocial()).append("]]></cbc:Name></cac:PartyName>\n");
        xml.append("      <cac:PartyLegalEntity>\n");
        xml.append("        <cbc:RegistrationName><![CDATA[").append(config.getRazonSocial()).append("]]></cbc:RegistrationName>\n");
        xml.append("        <cac:RegistrationAddress>\n");
        xml.append("          <cbc:ID>").append(config.getUbigeo()).append("</cbc:ID>\n");
        xml.append("          <cbc:AddressTypeCode>0000</cbc:AddressTypeCode>\n");
        xml.append("          <cbc:CityName>Lima</cbc:CityName>\n");
        xml.append("          <cbc:CountrySubentity>Lima</cbc:CountrySubentity>\n");
        xml.append("          <cbc:District>Carabayllo</cbc:District>\n");
        xml.append("          <cac:AddressLine><cbc:Line><![CDATA[").append(config.getDireccion()).append("]]></cbc:Line></cac:AddressLine>\n");
        xml.append("          <cac:Country><cbc:IdentificationCode>PE</cbc:IdentificationCode></cac:Country>\n");
        xml.append("        </cac:RegistrationAddress>\n");
        xml.append("      </cac:PartyLegalEntity>\n");
        xml.append("    </cac:Party>\n");
        xml.append("  </cac:AccountingSupplierParty>\n");

        // Cliente (Customer)
        xml.append("  <cac:AccountingCustomerParty>\n");
        xml.append("    <cac:Party>\n");
        xml.append("      <cac:PartyIdentification><cbc:ID schemeID=\"").append(tipoDocCliente).append("\">")
                .append(comprobante.getClienteNumeroDoc() != null ? comprobante.getClienteNumeroDoc() : "-")
                .append("</cbc:ID></cac:PartyIdentification>\n");
        xml.append("      <cac:PartyLegalEntity>\n");
        xml.append("        <cbc:RegistrationName><![CDATA[").append(comprobante.getClienteNombre()).append("]]></cbc:RegistrationName>\n");
        if (comprobante.getClienteDireccion() != null) {
            xml.append("        <cac:RegistrationAddress><cac:AddressLine><cbc:Line><![CDATA[")
                    .append(comprobante.getClienteDireccion()).append("]]></cbc:Line></cac:AddressLine></cac:RegistrationAddress>\n");
        }
        xml.append("      </cac:PartyLegalEntity>\n");
        xml.append("    </cac:Party>\n");
        xml.append("  </cac:AccountingCustomerParty>\n");

        // Totales de impuestos
        xml.append("  <cac:TaxTotal>\n");
        xml.append("    <cbc:TaxAmount currencyID=\"PEN\">").append(fmt(comprobante.getIgv())).append("</cbc:TaxAmount>\n");
        xml.append("    <cac:TaxSubtotal>\n");
        xml.append("      <cbc:TaxableAmount currencyID=\"PEN\">").append(fmt(comprobante.getSubtotal())).append("</cbc:TaxableAmount>\n");
        xml.append("      <cbc:TaxAmount currencyID=\"PEN\">").append(fmt(comprobante.getIgv())).append("</cbc:TaxAmount>\n");
        xml.append("      <cac:TaxCategory><cbc:ID>S</cbc:ID><cbc:Percent>18.00</cbc:Percent>\n");
        xml.append("        <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>\n");
        xml.append("      </cac:TaxCategory>\n");
        xml.append("    </cac:TaxSubtotal>\n");
        xml.append("  </cac:TaxTotal>\n");

        // Montos legales
        String requestedTag = (isCreditNote || isDebitNote) ? "RequestedMonetaryTotal" : "LegalMonetaryTotal";
        xml.append("  <cac:").append(requestedTag).append(">\n");
        xml.append("    <cbc:LineExtensionAmount currencyID=\"PEN\">").append(fmt(comprobante.getSubtotal())).append("</cbc:LineExtensionAmount>\n");
        xml.append("    <cbc:TaxInclusiveAmount currencyID=\"PEN\">").append(fmt(comprobante.getTotal())).append("</cbc:TaxInclusiveAmount>\n");
        xml.append("    <cbc:PayableAmount currencyID=\"PEN\">").append(fmt(comprobante.getTotal())).append("</cbc:PayableAmount>\n");
        xml.append("  </cac:").append(requestedTag).append(">\n");

        // Líneas de detalle
        int lineNum = 1;
        for (DetalleVenta det : venta.getDetalles()) {
            BigDecimal precioSinIgv = det.getPrecioUnitario().divide(new BigDecimal("1.18"), 6, RoundingMode.HALF_UP);
            BigDecimal baseLinea = precioSinIgv.multiply(BigDecimal.valueOf(det.getCantidad())).setScale(2, RoundingMode.HALF_UP);
            BigDecimal igvLinea = det.getSubtotal().subtract(baseLinea);

            String lineTag = isCreditNote ? "CreditNoteLine" : isDebitNote ? "DebitNoteLine" : "InvoiceLine";
            xml.append("  <cac:").append(lineTag).append(">\n");
            xml.append("    <cbc:ID>").append(lineNum++).append("</cbc:ID>\n");

            String qtyTag = isCreditNote ? "CreditedQuantity" : isDebitNote ? "DebitedQuantity" : "InvoicedQuantity";
            xml.append("    <cbc:").append(qtyTag).append(" unitCode=\"NIU\">").append(det.getCantidad()).append("</cbc:").append(qtyTag).append(">\n");

            xml.append("    <cbc:LineExtensionAmount currencyID=\"PEN\">").append(fmt(baseLinea)).append("</cbc:LineExtensionAmount>\n");
            xml.append("    <cac:PricingReference>\n");
            xml.append("      <cac:AlternativeConditionPrice>\n");
            xml.append("        <cbc:PriceAmount currencyID=\"PEN\">").append(fmt(det.getPrecioUnitario())).append("</cbc:PriceAmount>\n");
            xml.append("        <cbc:PriceTypeCode>01</cbc:PriceTypeCode>\n");
            xml.append("      </cac:AlternativeConditionPrice>\n");
            xml.append("    </cac:PricingReference>\n");
            xml.append("    <cac:TaxTotal>\n");
            xml.append("      <cbc:TaxAmount currencyID=\"PEN\">").append(fmt(igvLinea)).append("</cbc:TaxAmount>\n");
            xml.append("      <cac:TaxSubtotal>\n");
            xml.append("        <cbc:TaxableAmount currencyID=\"PEN\">").append(fmt(baseLinea)).append("</cbc:TaxableAmount>\n");
            xml.append("        <cbc:TaxAmount currencyID=\"PEN\">").append(fmt(igvLinea)).append("</cbc:TaxAmount>\n");
            xml.append("        <cac:TaxCategory><cbc:ID schemeID=\"UN/ECE 5305\">S</cbc:ID><cbc:Percent>18.00</cbc:Percent>\n");
            xml.append("          <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>\n");
            xml.append("        </cac:TaxCategory>\n");
            xml.append("      </cac:TaxSubtotal>\n");
            xml.append("    </cac:TaxTotal>\n");
            xml.append("    <cac:Item><cbc:Description><![CDATA[").append(det.getProductoNombre()).append("]]></cbc:Description></cac:Item>\n");
            xml.append("    <cac:Price><cbc:PriceAmount currencyID=\"PEN\">").append(fmt(precioSinIgv.setScale(2, RoundingMode.HALF_UP))).append("</cbc:PriceAmount></cac:Price>\n");
            xml.append("  </cac:").append(lineTag).append(">\n");
        }

        xml.append("</").append(rootTag).append(">");
        return xml.toString();
    }

    // =================== RESUMEN DIARIO ===================

    /**
     * Genera XML de Resumen Diario de boletas (RC-{fecha}-{correlativo})
     * según SUNAT UBL 2.0 Perú.
     */
    public String generarResumenDiarioXml(String identificador, LocalDate fechaEmision,
                                           LocalDate fechaReferencia, List<Comprobante> boletas,
                                           ConfiguracionEmpresa config) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<SummaryDocuments xmlns=\"urn:sunat:names:specification:ubl:peru:schema:xsd:SummaryDocuments-1\"\n");
        xml.append("  xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"\n");
        xml.append("  xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\"\n");
        xml.append("  xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"\n");
        xml.append("  xmlns:ext=\"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2\"\n");
        xml.append("  xmlns:sac=\"urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1\">\n");

        xml.append("  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>\n");
        xml.append("  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>\n");
        xml.append("  <cbc:CustomizationID>1.1</cbc:CustomizationID>\n");
        xml.append("  <cbc:ID>").append(identificador).append("</cbc:ID>\n");
        xml.append("  <cbc:ReferenceDate>").append(fechaReferencia.format(DATE_FMT)).append("</cbc:ReferenceDate>\n");
        xml.append("  <cbc:IssueDate>").append(fechaEmision.format(DATE_FMT)).append("</cbc:IssueDate>\n");

        // Emisor
        xml.append("  <cac:AccountingSupplierParty>\n");
        xml.append("    <cbc:CustomerAssignedAccountID>").append(config.getRuc()).append("</cbc:CustomerAssignedAccountID>\n");
        xml.append("    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>\n");
        xml.append("    <cac:Party><cac:PartyLegalEntity>\n");
        xml.append("      <cbc:RegistrationName><![CDATA[").append(config.getRazonSocial()).append("]]></cbc:RegistrationName>\n");
        xml.append("    </cac:PartyLegalEntity></cac:Party>\n");
        xml.append("  </cac:AccountingSupplierParty>\n");

        // Líneas (una por cada boleta)
        int lineNum = 1;
        for (Comprobante b : boletas) {
            String tipoDocClie = mapTipoDocCliente(b.getClienteTipoDoc());
            xml.append("  <sac:SummaryDocumentsLine>\n");
            xml.append("    <cbc:LineID>").append(lineNum++).append("</cbc:LineID>\n");
            xml.append("    <cbc:DocumentTypeCode>03</cbc:DocumentTypeCode>\n");
            xml.append("    <cbc:ID>").append(b.getNumeroCompleto()).append("</cbc:ID>\n");
            xml.append("    <cac:AccountingCustomerParty>\n");
            xml.append("      <cbc:CustomerAssignedAccountID>").append(b.getClienteNumeroDoc() != null ? b.getClienteNumeroDoc() : "0").append("</cbc:CustomerAssignedAccountID>\n");
            xml.append("      <cbc:AdditionalAccountID>").append(tipoDocClie).append("</cbc:AdditionalAccountID>\n");
            xml.append("    </cac:AccountingCustomerParty>\n");
            xml.append("    <cac:Status><cbc:ConditionCode>1</cbc:ConditionCode></cac:Status>\n");
            xml.append("    <sac:TotalAmount currencyID=\"PEN\">").append(fmt(b.getTotal())).append("</sac:TotalAmount>\n");
            xml.append("    <sac:BillingPayment>\n");
            xml.append("      <cbc:PaidAmount currencyID=\"PEN\">").append(fmt(b.getSubtotal())).append("</cbc:PaidAmount>\n");
            xml.append("      <cbc:InstructionID>01</cbc:InstructionID>\n");
            xml.append("    </sac:BillingPayment>\n");
            xml.append("    <cac:TaxTotal>\n");
            xml.append("      <cbc:TaxAmount currencyID=\"PEN\">").append(fmt(b.getIgv())).append("</cbc:TaxAmount>\n");
            xml.append("      <cac:TaxSubtotal>\n");
            xml.append("        <cbc:TaxAmount currencyID=\"PEN\">").append(fmt(b.getIgv())).append("</cbc:TaxAmount>\n");
            xml.append("        <cac:TaxCategory><cbc:ID>S</cbc:ID>\n");
            xml.append("          <cac:TaxScheme><cbc:ID>1000</cbc:ID><cbc:Name>IGV</cbc:Name><cbc:TaxTypeCode>VAT</cbc:TaxTypeCode></cac:TaxScheme>\n");
            xml.append("        </cac:TaxCategory>\n");
            xml.append("      </cac:TaxSubtotal>\n");
            xml.append("    </cac:TaxTotal>\n");
            xml.append("  </sac:SummaryDocumentsLine>\n");
        }

        xml.append("</SummaryDocuments>");
        return xml.toString();
    }

    // =================== COMUNICACION DE BAJA ===================

    /**
     * Genera XML de Comunicación de Baja (RA-{fecha}-{correlativo})
     * para anular comprobantes electrónicos en SUNAT.
     */
    public String generarComunicacionBajaXml(String identificador, LocalDate fechaEmision,
                                              LocalDate fechaDocumento, List<Comprobante> comprobantes,
                                              String motivo, ConfiguracionEmpresa config) {
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<VoidedDocuments xmlns=\"urn:sunat:names:specification:ubl:peru:schema:xsd:VoidedDocuments-1\"\n");
        xml.append("  xmlns:cac=\"urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2\"\n");
        xml.append("  xmlns:cbc=\"urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2\"\n");
        xml.append("  xmlns:ds=\"http://www.w3.org/2000/09/xmldsig#\"\n");
        xml.append("  xmlns:ext=\"urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2\"\n");
        xml.append("  xmlns:sac=\"urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1\">\n");

        xml.append("  <ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions>\n");
        xml.append("  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>\n");
        xml.append("  <cbc:CustomizationID>1.0</cbc:CustomizationID>\n");
        xml.append("  <cbc:ID>").append(identificador).append("</cbc:ID>\n");
        xml.append("  <cbc:ReferenceDate>").append(fechaDocumento.format(DATE_FMT)).append("</cbc:ReferenceDate>\n");
        xml.append("  <cbc:IssueDate>").append(fechaEmision.format(DATE_FMT)).append("</cbc:IssueDate>\n");

        // Emisor
        xml.append("  <cac:AccountingSupplierParty>\n");
        xml.append("    <cbc:CustomerAssignedAccountID>").append(config.getRuc()).append("</cbc:CustomerAssignedAccountID>\n");
        xml.append("    <cbc:AdditionalAccountID>6</cbc:AdditionalAccountID>\n");
        xml.append("    <cac:Party><cac:PartyLegalEntity>\n");
        xml.append("      <cbc:RegistrationName><![CDATA[").append(config.getRazonSocial()).append("]]></cbc:RegistrationName>\n");
        xml.append("    </cac:PartyLegalEntity></cac:Party>\n");
        xml.append("  </cac:AccountingSupplierParty>\n");

        // Líneas de baja
        int lineNum = 1;
        for (Comprobante c : comprobantes) {
            String tipoDoc = mapTipoDocumento(c.getTipoComprobante());
            xml.append("  <sac:VoidedDocumentsLine>\n");
            xml.append("    <cbc:LineID>").append(lineNum++).append("</cbc:LineID>\n");
            xml.append("    <cbc:DocumentTypeCode>").append(tipoDoc).append("</cbc:DocumentTypeCode>\n");
            xml.append("    <sac:DocumentSerialID>").append(c.getSerie()).append("</sac:DocumentSerialID>\n");
            xml.append("    <sac:DocumentNumberID>").append(c.getCorrelativo()).append("</sac:DocumentNumberID>\n");
            xml.append("    <sac:VoidReasonDescription><![CDATA[").append(motivo).append("]]></sac:VoidReasonDescription>\n");
            xml.append("  </sac:VoidedDocumentsLine>\n");
        }

        xml.append("</VoidedDocuments>");
        return xml.toString();
    }

    // =================== HELPERS ===================

    private String fmt(BigDecimal value) {
        return value != null ? value.setScale(2, RoundingMode.HALF_UP).toPlainString() : "0.00";
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

    private String mapTipoDocCliente(String tipoDoc) {
        if (tipoDoc == null) return "0";
        return switch (tipoDoc) {
            case "RUC" -> "6";
            case "DNI" -> "1";
            case "CARNET_EXTRANJERIA" -> "4";
            case "PASAPORTE" -> "7";
            default -> "0";
        };
    }

    private String mapMotivoNota(String motivo, boolean isDebitNote) {
        if (motivo == null) return isDebitNote ? "01" : "01";
        motivo = motivo.toUpperCase();
        if (isDebitNote) {
            if (motivo.contains("INTERES")) return "01";
            if (motivo.contains("PENALIDAD")) return "02";
            return "01";
        }
        // Nota de crédito
        if (motivo.contains("ANULACION")) return "01";
        if (motivo.contains("CORRECCION")) return "03";
        if (motivo.contains("DESCUENTO")) return "05";
        if (motivo.contains("DEVOLUCION")) return "06";
        return "01";
    }
}
