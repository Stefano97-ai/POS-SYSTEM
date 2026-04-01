package com.importacionesnunez.pos.common.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class IGVCalculator {

    public static final BigDecimal IGV_RATE = new BigDecimal("18.00");
    public static final BigDecimal IGV_FACTOR = new BigDecimal("1.18");

    private IGVCalculator() {}

    public static BigDecimal calcularIGV(BigDecimal montoConIGV) {
        return montoConIGV.subtract(montoConIGV.divide(IGV_FACTOR, 2, RoundingMode.HALF_UP));
    }

    public static BigDecimal calcularSubtotal(BigDecimal montoConIGV) {
        return montoConIGV.divide(IGV_FACTOR, 2, RoundingMode.HALF_UP);
    }

    public static BigDecimal agregarIGV(BigDecimal montoSinIGV) {
        return montoSinIGV.multiply(IGV_FACTOR).setScale(2, RoundingMode.HALF_UP);
    }

    public static BigDecimal calcularIGVDesdeBase(BigDecimal montoSinIGV) {
        return montoSinIGV.multiply(IGV_RATE).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }
}
