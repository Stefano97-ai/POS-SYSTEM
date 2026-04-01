package com.importacionesnunez.pos.common.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String entity, String field, Object value) {
        super(String.format("%s no encontrado con %s: %s", entity, field, value));
    }
}
