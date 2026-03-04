package org.thomcgn.backend.common.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.thomcgn.backend.common.dto.ApiErrorResponse;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest req
    ) {
        List<ApiErrorResponse.FieldErrorItem> fieldErrors =
                ex.getBindingResult().getFieldErrors().stream()
                        // z.B. "bezugspersonen[0].create.vorname"
                        .map(fe -> new ApiErrorResponse.FieldErrorItem(fe.getField(), fe.getDefaultMessage()))
                        .sorted(Comparator.comparing(ApiErrorResponse.FieldErrorItem::field))
                        .toList();

        String msg = fieldErrors.isEmpty()
                ? "Validierung fehlgeschlagen"
                : "Bitte Pflichtfelder prüfen";

        ApiErrorResponse body = new ApiErrorResponse(
                Instant.now(),
                HttpStatus.BAD_REQUEST.value(),
                HttpStatus.BAD_REQUEST.getReasonPhrase(),
                msg,
                req.getRequestURI(),
                fieldErrors
        );
        return ResponseEntity.badRequest().body(body);
    }
}