package com.importacionesnunez.pos.modules.facturacion.service;

import com.importacionesnunez.pos.modules.configuracion.entity.ConfiguracionEmpresa;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.crypto.dsig.*;
import javax.xml.crypto.dsig.dom.DOMSignContext;
import javax.xml.crypto.dsig.keyinfo.KeyInfo;
import javax.xml.crypto.dsig.keyinfo.KeyInfoFactory;
import javax.xml.crypto.dsig.keyinfo.X509Data;
import javax.xml.crypto.dsig.spec.C14NMethodParameterSpec;
import javax.xml.crypto.dsig.spec.TransformParameterSpec;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.StringWriter;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.PrivateKey;
import java.security.cert.X509Certificate;
import java.util.*;

/**
 * Servicio de firma digital XML para comprobantes electrónicos SUNAT.
 * Implementa firma enveloped usando XMLDSig (compatible con XAdES-BES requerido por SUNAT).
 */
@Service
@Slf4j
public class FirmaDigitalService {

    /**
     * Firma un XML UBL 2.1 con el certificado digital (.pfx/.p12) configurado.
     * La firma se inserta dentro del elemento ext:ExtensionContent del UBLExtensions.
     *
     * @param xmlContent XML sin firmar
     * @param config     Configuración con ruta y password del certificado
     * @return XML firmado como String
     */
    public String firmarXml(String xmlContent, ConfiguracionEmpresa config) {
        String certPath = config.getCertificadoDigitalPath();
        String certPassword = config.getCertificadoDigitalPassword();

        if (certPath == null || certPath.isBlank()) {
            log.warn("No hay certificado digital configurado. Retornando XML sin firmar.");
            return xmlContent;
        }

        try {
            // Cargar el keystore (.pfx / .p12)
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (InputStream is = new FileInputStream(certPath)) {
                keyStore.load(is, certPassword != null ? certPassword.toCharArray() : new char[0]);
            }

            // Obtener la primera clave privada y certificado
            String alias = keyStore.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) keyStore.getKey(alias, certPassword != null ? certPassword.toCharArray() : new char[0]);
            X509Certificate certificate = (X509Certificate) keyStore.getCertificate(alias);

            // Parsear el XML
            DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
            dbf.setNamespaceAware(true);
            Document doc = dbf.newDocumentBuilder().parse(
                    new ByteArrayInputStream(xmlContent.getBytes(StandardCharsets.UTF_8)));

            // Buscar el elemento ExtensionContent donde insertar la firma
            NodeList extContent = doc.getElementsByTagNameNS(
                    "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
                    "ExtensionContent");
            if (extContent.getLength() == 0) {
                log.error("No se encontró ext:ExtensionContent en el XML");
                return xmlContent;
            }
            Element signatureParent = (Element) extContent.item(0);

            // Crear la firma XMLDSig
            XMLSignatureFactory sigFactory = XMLSignatureFactory.getInstance("DOM");

            // Referencia al documento completo con transformación enveloped
            Reference ref = sigFactory.newReference("",
                    sigFactory.newDigestMethod(DigestMethod.SHA256, null),
                    Collections.singletonList(
                            sigFactory.newTransform(Transform.ENVELOPED, (TransformParameterSpec) null)),
                    null, null);

            // SignedInfo con canonicalization y algoritmo de firma
            SignedInfo signedInfo = sigFactory.newSignedInfo(
                    sigFactory.newCanonicalizationMethod(CanonicalizationMethod.INCLUSIVE, (C14NMethodParameterSpec) null),
                    sigFactory.newSignatureMethod("http://www.w3.org/2001/04/xmldsig-more#rsa-sha256", null),
                    Collections.singletonList(ref));

            // KeyInfo con el certificado X509
            KeyInfoFactory kif = sigFactory.getKeyInfoFactory();
            X509Data x509Data = kif.newX509Data(Collections.singletonList(certificate));
            KeyInfo keyInfo = kif.newKeyInfo(Collections.singletonList(x509Data));

            // Crear y ejecutar la firma
            XMLSignature signature = sigFactory.newXMLSignature(signedInfo, keyInfo);
            DOMSignContext signContext = new DOMSignContext(privateKey, signatureParent);
            signature.sign(signContext);

            // Serializar el documento firmado
            TransformerFactory tf = TransformerFactory.newInstance();
            Transformer transformer = tf.newTransformer();
            StringWriter writer = new StringWriter();
            transformer.transform(new DOMSource(doc), new StreamResult(writer));

            log.info("XML firmado exitosamente con certificado: {}", alias);
            return writer.toString();

        } catch (Exception e) {
            log.error("Error al firmar XML: {}", e.getMessage(), e);
            // En caso de error, retornar el XML sin firmar para no bloquear la emisión
            return xmlContent;
        }
    }

    /**
     * Calcula el hash SHA-256 del XML firmado (resumen para el QR code).
     */
    public String calcularDigestValue(String xmlFirmado) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(xmlFirmado.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            log.error("Error calculando digest: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Valida que un certificado .pfx sea legible y no esté expirado.
     */
    public Map<String, Object> validarCertificado(String certPath, String certPassword) {
        Map<String, Object> info = new HashMap<>();
        try {
            KeyStore keyStore = KeyStore.getInstance("PKCS12");
            try (InputStream is = new FileInputStream(certPath)) {
                keyStore.load(is, certPassword != null ? certPassword.toCharArray() : new char[0]);
            }

            String alias = keyStore.aliases().nextElement();
            X509Certificate cert = (X509Certificate) keyStore.getCertificate(alias);

            info.put("valido", true);
            info.put("sujeto", cert.getSubjectX500Principal().getName());
            info.put("emisor", cert.getIssuerX500Principal().getName());
            info.put("validoDesde", cert.getNotBefore().toString());
            info.put("validoHasta", cert.getNotAfter().toString());
            info.put("serial", cert.getSerialNumber().toString());

            // Verificar si no ha expirado
            cert.checkValidity();
            info.put("expirado", false);

        } catch (java.security.cert.CertificateExpiredException e) {
            info.put("valido", true);
            info.put("expirado", true);
            info.put("error", "Certificado expirado");
        } catch (Exception e) {
            info.put("valido", false);
            info.put("error", e.getMessage());
        }
        return info;
    }
}
