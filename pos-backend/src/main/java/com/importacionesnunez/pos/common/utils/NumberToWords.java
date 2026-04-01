package com.importacionesnunez.pos.common.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class NumberToWords {

    private static final String[] UNIDADES = {"", "UN ", "DOS ", "TRES ", "CUATRO ", "CINCO ", "SEIS ", "SIETE ", "OCHO ", "NUEVE "};
    private static final String[] DECENAS = {"DIECI", "VEINTI", "TREINTA ", "CUARENTA ", "CINCUENTA ", "SESENTA ", "SETENTA ", "OCHENTA ", "NOVENTA "};
    private static final String[] CENTENAS = {"", "CIENTO ", "DOSCIENTOS ", "TRESCIENTOS ", "CUATROCIENTOS ", "QUINIENTOS ", "SEISCIENTOS ", "SETECIENTOS ", "OCHOCIENTOS ", "NOVECIENTOS "};

    public static String convert(BigDecimal amount, String currency) {
        String literal = "";
        String parteEntera;
        String parteDecimal;

        amount = amount.setScale(2, RoundingMode.HALF_UP);
        String[] parts = amount.toPlainString().split("\\.");
        parteEntera = parts[0];
        parteDecimal = parts[1] + "/100 " + currency;

        if (Integer.parseInt(parteEntera) == 0) {
            literal = "CERO ";
        } else if (Integer.parseInt(parteEntera) > 999999) {
            literal = getMillones(parteEntera);
        } else if (Integer.parseInt(parteEntera) > 999) {
            literal = getMiles(parteEntera);
        } else if (Integer.parseInt(parteEntera) > 99) {
            literal = getCentenas(parteEntera);
        } else if (Integer.parseInt(parteEntera) > 9) {
            literal = getDecenas(parteEntera);
        } else {
            literal = getUnidades(parteEntera);
        }

        return "SON: " + literal + "CON " + parteDecimal;
    }

    private static String getUnidades(String numero) {
        String num = numero.substring(numero.length() - 1);
        return UNIDADES[Integer.parseInt(num)];
    }

    private static String getDecenas(String num) {
        int n = Integer.parseInt(num);
        if (n < 10) {
            return getUnidades(num);
        } else if (n == 10) {
            return "DIEZ ";
        } else if (n == 11) {
            return "ONCE ";
        } else if (n == 12) {
            return "DOCE ";
        } else if (n == 13) {
            return "TRECE ";
        } else if (n == 14) {
            return "CATORCE ";
        } else if (n == 15) {
            return "QUINCE ";
        } else if (n < 20) {
            return "DIECI" + getUnidades(num);
        } else if (n == 20) {
            return "VEINTE ";
        } else if (n < 30) {
            return "VEINTI" + getUnidades(num);
        } else {
            String t = getUnidades(num);
            if (t.equals("")) {
                return DECENAS[Integer.parseInt(num.substring(0, 1)) - 1];
            } else {
                return DECENAS[Integer.parseInt(num.substring(0, 1)) - 1] + "Y " + t;
            }
        }
    }

    private static String getCentenas(String num) {
        if (Integer.parseInt(num) > 99) {
            if (Integer.parseInt(num) == 100) {
                return "CIEN ";
            } else {
                return CENTENAS[Integer.parseInt(num.substring(0, 1))] + getDecenas(num.substring(1));
            }
        } else {
            return getDecenas(Integer.parseInt(num) + "");
        }
    }

    private static String getMiles(String numero) {
        int n = Integer.parseInt(numero);
        String c = numero.substring(numero.length() - 3);
        String m = numero.substring(0, numero.length() - 3);
        String nsm = "";
        if (n == 1000) {
            nsm = "MIL ";
        } else if (n > 1000) {
            nsm = getCentenas(m) + "MIL ";
        }
        return nsm + getCentenas(c);
    }

    private static String getMillones(String numero) {
        String m = numero.substring(0, numero.length() - 6);
        String c = numero.substring(numero.length() - 6);
        String nsm = "";
        if (Integer.parseInt(m) == 1) {
            nsm = "UN MILLON ";
        } else {
            nsm = getCentenas(m) + "MILLONES ";
        }
        return nsm + getMiles(c);
    }
}
