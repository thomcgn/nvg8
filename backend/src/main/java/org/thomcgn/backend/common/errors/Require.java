package org.thomcgn.backend.common.errors;

import java.util.Map;
import java.util.function.Supplier;

public final class Require {
    private Require() {}

    public static <T> T notNull(T value, ErrorCode code, String message) {
        if (value == null) throw DomainException.badRequest(code, message);
        return value;
    }

    public static void that(boolean condition, Supplier<DomainException> ex) {
        if (!condition) throw ex.get();
    }

    public static void forbiddenUnless(boolean condition, ErrorCode code, String message) {
        if (!condition) throw DomainException.forbidden(code, message);
    }

    public static void notFoundUnless(boolean condition, ErrorCode code, String message, Map<String,Object> meta) {
        if (!condition) throw DomainException.withMeta(org.springframework.http.HttpStatus.NOT_FOUND, code, message, meta);
    }
}