package com.importacionesnunez.pos.modules.facturacion.service;

import com.importacionesnunez.pos.common.utils.NumberToWords;
import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import com.importacionesnunez.pos.modules.facturacion.entity.Comprobante;
import com.importacionesnunez.pos.modules.venta.entity.DetalleVenta;
import com.importacionesnunez.pos.modules.venta.entity.Venta;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfGeneratorService {

    private static final Font TITLE_FONT = new Font(Font.HELVETICA, 14, Font.BOLD);
    private static final Font HEADER_FONT = new Font(Font.HELVETICA, 10, Font.BOLD);
    private static final Font NORMAL_FONT = new Font(Font.HELVETICA, 9, Font.NORMAL);
    private static final Font BOLD_FONT = new Font(Font.HELVETICA, 9, Font.BOLD);
    private static final Font SMALL_FONT = new Font(Font.HELVETICA, 8, Font.NORMAL);

    public byte[] generarPdf(Comprobante comprobante, Venta venta, ConfiguracionEmpresa config) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 30, 30, 30, 30);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            // Cabecera: Empresa Izquierda, Comprobante Derecha
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setWidths(new float[]{60, 40});

            // Lado Izquierdo: Datos Empresa
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            leftCell.addElement(new Paragraph(config.getRazonSocial(), TITLE_FONT));
            if (config.getNombreComercial() != null) {
                leftCell.addElement(new Paragraph(config.getNombreComercial(), HEADER_FONT));
            }
            leftCell.addElement(new Paragraph(config.getDireccion(), SMALL_FONT));
            leftCell.addElement(new Paragraph("Telf: " + config.getTelefono() + " | Email: " + config.getEmail(), SMALL_FONT));
            headerTable.addCell(leftCell);

            // Lado Derecho: Recuadro RUC/Tipo/Numero
            PdfPCell rightCell = new PdfPCell();
            rightCell.setPadding(10);
            rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            String tipoLabel = switch (comprobante.getTipoComprobante()) {
                case "FACTURA" -> "FACTURA ELECTRÓNICA";
                case "BOLETA" -> "BOLETA DE VENTA ELECTRÓNICA";
                case "NOTA_CREDITO" -> "NOTA DE CRÉDITO ELECTRÓNICA";
                case "NOTA_DEBITO" -> "NOTA DE DÉBITO ELECTRÓNICA";
                default -> "COMPROBANTE ELECTRÓNICO";
            };
            Paragraph rucP = new Paragraph("R.U.C. " + config.getRuc(), TITLE_FONT);
            rucP.setAlignment(Element.ALIGN_CENTER);
            Paragraph tipoP = new Paragraph(tipoLabel, HEADER_FONT);
            tipoP.setAlignment(Element.ALIGN_CENTER);
            Paragraph numP = new Paragraph(comprobante.getNumeroCompleto(), TITLE_FONT);
            numP.setAlignment(Element.ALIGN_CENTER);
            rightCell.addElement(rucP);
            rightCell.addElement(tipoP);
            rightCell.addElement(numP);
            headerTable.addCell(rightCell);

            doc.add(headerTable);
            doc.add(new Paragraph(" "));

            // Datos del cliente
            PdfPTable clienteTable = new PdfPTable(2);
            clienteTable.setWidthPercentage(100);
            clienteTable.setWidths(new float[]{20, 80});

            addInfoRow(clienteTable, "SEÑOR(ES):", comprobante.getClienteNombre());
            addInfoRow(clienteTable, comprobante.getClienteTipoDoc() != null ? comprobante.getClienteTipoDoc() + ":" : "DOC:", 
                    comprobante.getClienteNumeroDoc() != null ? comprobante.getClienteNumeroDoc() : "-");
            addInfoRow(clienteTable, "DIRECCIÓN:", comprobante.getClienteDireccion() != null ? comprobante.getClienteDireccion() : "-");
            addInfoRow(clienteTable, "FECHA EMISIÓN:", comprobante.getFechaEmision().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            addInfoRow(clienteTable, "MONEDA:", "SOLES (PEN)");
            
            if (comprobante.getComprobanteReferencia() != null) {
                addInfoRow(clienteTable, "DOC. REFERENCIA:", comprobante.getComprobanteReferencia().getNumeroCompleto());
                addInfoRow(clienteTable, "MOTIVO:", comprobante.getMotivoNota());
            }

            doc.add(clienteTable);
            doc.add(new Paragraph(" "));

            // Tabla de items
            PdfPTable itemsTable = new PdfPTable(5);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{8, 52, 10, 15, 15});

            Color headerBg = new Color(45, 55, 72);
            addHeaderCell(itemsTable, "CANT", headerBg);
            addHeaderCell(itemsTable, "DESCRIPCIÓN", headerBg);
            addHeaderCell(itemsTable, "UND", headerBg);
            addHeaderCell(itemsTable, "P. UNIT", headerBg);
            addHeaderCell(itemsTable, "TOTAL", headerBg);

            for (DetalleVenta det : venta.getDetalles()) {
                addCell(itemsTable, String.valueOf(det.getCantidad()), NORMAL_FONT, Element.ALIGN_CENTER);
                addCell(itemsTable, det.getProductoNombre(), NORMAL_FONT, Element.ALIGN_LEFT);
                addCell(itemsTable, "NIU", SMALL_FONT, Element.ALIGN_CENTER);
                addCell(itemsTable, det.getPrecioUnitario().toPlainString(), NORMAL_FONT, Element.ALIGN_RIGHT);
                addCell(itemsTable, det.getSubtotal().toPlainString(), NORMAL_FONT, Element.ALIGN_RIGHT);
            }
            doc.add(itemsTable);
            doc.add(new Paragraph(" "));

            // Totales, QR y Leyendas
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(100);
            footerTable.setWidths(new float[]{25, 45, 30});

            // QR Code (CELDA 1)
            byte[] qrBytes = generateQRCode(formatQrData(comprobante, config));
            Image qrImg = Image.getInstance(qrBytes);
            qrImg.scaleToFit(80, 80);
            PdfPCell qrCell = new PdfPCell(qrImg);
            qrCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            footerTable.addCell(qrCell);

            // Leyendas (CELDA 2)
            PdfPCell legendCell = new PdfPCell();
            legendCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            legendCell.addElement(new Paragraph(NumberToWords.convert(comprobante.getTotal(), "SOLES"), SMALL_FONT));
            legendCell.addElement(new Paragraph(" "));
            legendCell.addElement(new Paragraph("Representación impresa de la " + tipoLabel + ".", SMALL_FONT));
            legendCell.addElement(new Paragraph("Consulte su comprobante en: " + config.getOseApiUrl(), SMALL_FONT));
            if (comprobante.getHashCdr() != null) {
                legendCell.addElement(new Paragraph("Hash: " + comprobante.getHashCdr(), SMALL_FONT));
            }
            footerTable.addCell(legendCell);

            // Montos (CELDA 3)
            PdfPCell totalsCell = new PdfPCell();
            totalsCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
            PdfPTable totalsSubTable = new PdfPTable(2);
            totalsSubTable.setWidthPercentage(100);
            addTotalRow(totalsSubTable, "OP. GRAVADA:", comprobante.getSubtotal().toPlainString());
            addTotalRow(totalsSubTable, "I.G.V. (18%):", comprobante.getIgv().toPlainString());
            addTotalRow(totalsSubTable, "TOTAL:", "S/ " + comprobante.getTotal().toPlainString());
            totalsCell.addElement(totalsSubTable);
            footerTable.addCell(totalsCell);

            doc.add(footerTable);

            doc.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generando PDF: " + e.getMessage(), e);
        }
    }

    private void addInfoRow(PdfPTable table, String label, String value) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, BOLD_FONT));
        lCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        table.addCell(lCell);
        PdfPCell vCell = new PdfPCell(new Phrase(value, NORMAL_FONT));
        vCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        table.addCell(vCell);
    }

    private void addTotalRow(PdfPTable table, String label, String value) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, BOLD_FONT));
        lCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        lCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(lCell);
        PdfPCell vCell = new PdfPCell(new Phrase(value, NORMAL_FONT));
        vCell.setBorder(com.lowagie.text.Rectangle.NO_BORDER);
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(vCell);
    }

    private void addCell(PdfPTable table, String text, Font font, int align) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4);
        cell.setHorizontalAlignment(align);
        table.addCell(cell);
    }

    private void addHeaderCell(PdfPTable table, String text, Color bg) {
        PdfPCell cell = new PdfPCell(new Phrase(text, new Font(Font.HELVETICA, 9, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(bg);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private String formatQrData(Comprobante c, ConfiguracionEmpresa config) {
        // Formato SUNAT: RUC | TIPO | SERIE | NUMERO | IGV | TOTAL | FECHA | TIPO_DOC_CLIE | NUM_DOC_CLIE | HASH |
        String tipoDoc = switch (c.getTipoComprobante()) {
            case "FACTURA" -> "01";
            case "BOLETA" -> "03";
            case "NOTA_CREDITO" -> "07";
            default -> "01";
        };
        String tipoDocClie = switch (c.getClienteTipoDoc() != null ? c.getClienteTipoDoc() : "") {
            case "RUC" -> "6";
            case "DNI" -> "1";
            default -> "0";
        };
        return String.format("%s|%s|%s|%s|%s|%s|%s|%s|%s|%s|",
                config.getRuc(),
                tipoDoc,
                c.getSerie(),
                c.getCorrelativo(),
                c.getIgv(),
                c.getTotal(),
                c.getFechaEmision().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                tipoDocClie,
                c.getClienteNumeroDoc() != null ? c.getClienteNumeroDoc() : "-",
                c.getHashCdr() != null ? c.getHashCdr() : "");
    }

    private byte[] generateQRCode(String data) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix bitMatrix = writer.encode(data, BarcodeFormat.QR_CODE, 200, 200);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        return outputStream.toByteArray();
    }
}
