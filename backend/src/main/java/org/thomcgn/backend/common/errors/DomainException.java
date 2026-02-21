package org.thomcgn.backend.common.errors;

import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.Map;

public class DomainException extends RuntimeException {

    private final HttpStatus status;
    private final ErrorCode code;
    private final Map<String, Object> meta;

    public DomainException(HttpStatus status, ErrorCode code, String message) {
        super(message);
        this.status = status;
        this.code = code;
        this.meta = Collections.emptyMap();
    }

    public DomainException(HttpStatus status, ErrorCode code, String message, Map<String, Object> meta) {
        super(message);
        this.status = status;
        this.code = code;
        this.meta = (meta == null) ? Collections.emptyMap() : Map.copyOf(meta);
    }

    public HttpStatus getStatus() { return status; }
    public ErrorCode getCode() { return code; }
    public Map<String, Object> getMeta() { return meta; }

    // ---- Convenience factories ----

    public static DomainException badRequest(ErrorCode code, String message) {
        return new DomainException(HttpStatus.BAD_REQUEST, code, message);
    }

    public static DomainException unauthorized(ErrorCode code, String message) {
        return new DomainException(HttpStatus.UNAUTHORIZED, code, message);
    }

    public static DomainException forbidden(ErrorCode code, String message) {
        return new DomainException(HttpStatus.FORBIDDEN, code, message);
    }

    public static DomainException notFound(ErrorCode code, String message) {
        return new DomainException(HttpStatus.NOT_FOUND, code, message);
    }

    public static DomainException conflict(ErrorCode code, String message) {
        return new DomainException(HttpStatus.CONFLICT, code, message);
    }

    public static DomainException withMeta(HttpStatus status, ErrorCode code, String message, Map<String, Object> meta) {
        return new DomainException(status, code, message, meta);
    }
}