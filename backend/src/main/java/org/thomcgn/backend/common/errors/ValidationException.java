package org.thomcgn.backend.common.errors;

import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

public class ValidationException extends DomainException {

    // field -> message
    private final Map<String, String> fieldErrors;

    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(HttpStatus.BAD_REQUEST, ErrorCode.VALIDATION_FAILED, message);
        this.fieldErrors = (fieldErrors == null) ? Collections.emptyMap() : Map.copyOf(fieldErrors);
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}