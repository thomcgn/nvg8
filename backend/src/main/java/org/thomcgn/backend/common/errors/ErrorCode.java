package org.thomcgn.backend.common.errors;

public enum ErrorCode {
    // Auth / Security
    AUTH_INVALID_CREDENTIALS,
    AUTH_TOKEN_INVALID,
    CONTEXT_REQUIRED,
    ACCESS_DENIED,

    // Tenancy / Org
    TRAEGER_NOT_FOUND,
    ORG_UNIT_NOT_FOUND,
    ORG_UNIT_DISABLED,

    // Users
    USER_NOT_FOUND,
    USER_DISABLED,
    USER_EMAIL_ALREADY_EXISTS,

    // Validation / Generic
    VALIDATION_FAILED,
    CONFLICT,
    NOT_FOUND,
    INTERNAL_ERROR
}