package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.io.IOException;
import java.time.Instant;

public class ProblemAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, AccessDeniedException ex)
            throws IOException {

        // Wenn wir DomainException (Forbidden) geworfen haben, nutzen wir deren Code/Message.
        ErrorCode code = ErrorCode.ACCESS_DENIED;
        String detail = "You do not have permission to access this resource.";

        Throwable cause = ex.getCause();
        if (cause instanceof DomainException de) {
            code = de.getCode();
            detail = de.getMessage();
        }

        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        pd.setTitle(code.name());
        pd.setDetail(detail);
        pd.setProperty("code", code.name());
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("path", request.getRequestURI());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType("application/problem+json");
        objectMapper.writeValue(response.getOutputStream(), pd);
    }
}