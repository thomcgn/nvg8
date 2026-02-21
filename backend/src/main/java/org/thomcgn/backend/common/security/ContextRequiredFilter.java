package org.thomcgn.backend.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.io.IOException;
import java.util.List;

public class ContextRequiredFilter extends OncePerRequestFilter {

    private final List<String> allowPrefixes = List.of(
            "/auth/login",
            "/auth/context",
            "/auth/switch-context",
            "/actuator",
            "/swagger-ui",
            "/v3/api-docs",
            "/external/**"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return allowPrefixes.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // JwtAuthFilter hat bereits principal gesetzt, wenn Token ok ist.
        // Wenn nicht authentifiziert -> Spring Security handled 401 via EntryPoint.
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            // Wird in der Praxis selten hier landen, aber safe:
            throw DomainException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Authentication required.");
        }

        if (!(auth.getDetails() instanceof JwtPrincipal principal)) {
            throw DomainException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Invalid authentication context.");
        }

        if (!principal.isContext()) {
            throw DomainException.forbidden(
                    ErrorCode.CONTEXT_REQUIRED,
                    "You must select an active organization context before accessing this resource."
            );
        }

        filterChain.doFilter(request, response);
    }
}