package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.io.IOException;
import java.time.Instant;

public class ProblemAuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {

        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        pd.setTitle(ErrorCode.AUTH_TOKEN_INVALID.name());
        pd.setDetail("Authentication required.");
        pd.setProperty("code", ErrorCode.AUTH_TOKEN_INVALID.name());
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("path", request.getRequestURI());

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/problem+json");
        objectMapper.writeValue(response.getOutputStream(), pd);
    }
}