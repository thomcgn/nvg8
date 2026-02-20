package org.thomcgn.backend.common.errors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(DomainException.class)
    public ProblemDetail handleDomain(DomainException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(ex.getStatus());
        pd.setTitle(ex.getCode().name());
        pd.setDetail(ex.getMessage());
        pd.setProperty("code", ex.getCode().name());
        pd.setProperty("timestamp", Instant.now());

        if (ex.getMeta() != null && !ex.getMeta().isEmpty()) {
            pd.setProperty("meta", ex.getMeta());
        }

        if (ex instanceof ValidationException vex && !vex.getFieldErrors().isEmpty()) {
            pd.setProperty("fieldErrors", vex.getFieldErrors());
        }

        return pd;
    }

    // Optional: map Spring Security bad credentials -> DomainException format
    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        return handleDomain(DomainException.unauthorized(
                ErrorCode.AUTH_INVALID_CREDENTIALS,
                "Invalid email or password"
        ));
    }

    // Optional: Access denied -> DomainException format
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        return handleDomain(DomainException.forbidden(
                ErrorCode.ACCESS_DENIED,
                "You do not have permission to access this resource."
        ));
    }

    // Optional: Bean Validation (Jakarta) -> DomainException format
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));

        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        fe -> fe.getField(),
                        fe -> fe.getDefaultMessage() == null ? "invalid" : fe.getDefaultMessage(),
                        (a, b) -> a, // keep first
                        HashMap::new
                ));

        return handleDomain(new ValidationException("Validation failed", fieldErrors));
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        return handleDomain(DomainException.withMeta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                ErrorCode.INTERNAL_ERROR,
                "An unexpected error occurred.",
                Map.of("exception", ex.getClass().getSimpleName())
        ));
    }
}