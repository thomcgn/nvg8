package org.thomcgn.backend.common.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

public class ContextRequiredFilter extends OncePerRequestFilter {

    private final List<String> allowPrefixes = List.of(
            "/auth/login",
            "/auth/context",         // GET /auth/context
            "/auth/context/switch",  // POST /auth/context/switch
            "/actuator",
            "/swagger-ui",
            "/v3/api-docs",
            "/external"
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return allowPrefixes.stream().anyMatch(path::startsWith);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Authentication required.");
            return;
        }

        if (!(auth.getDetails() instanceof JwtPrincipal principal)) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid authentication context.");
            return;
        }

        if (!principal.isContext() || principal.getTraegerId() == null || principal.getOrgUnitId() == null) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN,
                    "You must select an active organization context before accessing this resource.");
            return;
        }

        filterChain.doFilter(request, response);
    }
}