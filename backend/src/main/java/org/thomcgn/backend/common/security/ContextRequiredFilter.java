package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.filter.OncePerRequestFilter;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class ContextRequiredFilter extends OncePerRequestFilter {

    private final ObjectMapper objectMapper;

    // Endpoints, die OHNE Context erreichbar sein müssen
    private final List<String> allowPrefixes = List.of(
            "/auth/login",
            "/auth/logout",
            "/auth/accept-invite",
            "/auth/context",         // GET /auth/context
            "/auth/context/switch",  // POST /auth/context/switch
            "/actuator",
            "/swagger-ui",
            "/v3/api-docs",
            "/external",
            "/error"
    );

    public ContextRequiredFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return allowPrefixes.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();

        // Kein Auth -> 401 ProblemDetail
        if (auth == null || auth.getDetails() == null) {
            writeProblem(response, request, HttpStatus.UNAUTHORIZED,
                    ErrorCode.AUTH_REQUIRED.name(),
                    "Authentication required.",
                    Map.of());
            return;
        }

        if (!(auth.getDetails() instanceof JwtPrincipal principal)) {
            writeProblem(response, request, HttpStatus.UNAUTHORIZED,
                    ErrorCode.AUTH_REQUIRED.name(),
                    "Invalid authentication context.",
                    Map.of());
            return;
        }

        // Context fehlt -> 403 ProblemDetail (CONTEXT_REQUIRED)
        // (Context-Token muss gesetzt sein + traegerId + orgUnitId)
        if (!principal.isContext() || principal.getTraegerId() == null || principal.getOrgUnitId() == null) {

            Map<String, Object> meta = Map.of(
                    "activeTraegerId", principal.getTraegerId(),
                    "activeEinrichtungOrgUnitId", principal.getOrgUnitId(),
                    "isContextToken", principal.isContext()
            );

            writeProblem(response, request, HttpStatus.FORBIDDEN,
                    ErrorCode.CONTEXT_REQUIRED.name(),
                    "You must select an active organization context before accessing this resource.",
                    meta);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void writeProblem(
            HttpServletResponse response,
            HttpServletRequest request,
            HttpStatus status,
            String code,
            String detail,
            Map<String, Object> meta
    ) throws IOException {

        if (response.isCommitted()) return;

        ProblemDetail pd = ProblemDetail.forStatus(status);
        pd.setTitle(code);
        pd.setDetail(detail);
        pd.setProperty("code", code);
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("path", request.getRequestURI());
        if (meta != null && !meta.isEmpty()) {
            pd.setProperty("meta", meta);
        }

        response.setStatus(status.value());
        response.setContentType("application/problem+json");
        objectMapper.writeValue(response.getOutputStream(), pd);
    }
}