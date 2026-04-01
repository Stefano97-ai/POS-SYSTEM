package com.importacionesnunez.pos.common.exception;

public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(String productoNombre, int stockActual, int cantidadSolicitada) {
        super(String.format("Stock insuficiente para '%s'. Stock actual: %d, Solicitado: %d",
                productoNombre, stockActual, cantidadSolicitada));
    }
}
