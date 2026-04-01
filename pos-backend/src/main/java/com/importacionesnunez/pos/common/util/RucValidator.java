package com.importacionesnunez.pos.common.util;

public final class RucValidator {

    private RucValidator() {}

    public static boolean isValidRuc(String ruc) {
        if (ruc == null || ruc.length() != 11) return false;
        if (!ruc.matches("\\d{11}")) return false;
        String prefix = ruc.substring(0, 2);
        return prefix.equals("10") || prefix.equals("15") || prefix.equals("17") || prefix.equals("20");
    }

    public static boolean isValidDni(String dni) {
        return dni != null && dni.matches("\\d{8}");
    }
}
