package org.thomcgn.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.thomcgn.backend.auth.data.Role;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.auth.repo.UserRepository;
import org.thomcgn.backend.auth.service.JwtService;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;

    // keep injected (future: revocation / enabled checks). We intentionally do NOT hit DB per request.
    @SuppressWarnings("unused")
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Wenn schon authentifiziert: nichts tun
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = null;

        // 1) Authorization Header (optional)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        }

        // 2) Cookie "token"
        if ((token == null || token.isBlank()) && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        // Debug: kein Token angekommen
        if (token == null || token.isBlank()) {
            log.info("[JWT] NO TOKEN {} {}", request.getMethod(), request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        try {
            var claims = jwtService.parseToken(token);

            // subject = userId (siehe JwtService.generateToken)
            Long userId = null;
            String sub = claims.getSubject();
            if (sub != null && !sub.isBlank()) {
                try {
                    userId = Long.parseLong(sub);
                } catch (NumberFormatException ignored) {
                }
            }

            String email = claims.get("email", String.class);
            String roleStr = claims.get("role", String.class);
            String name = claims.get("name", String.class);
            Long lastLogin = claims.get("lastLogin", Long.class);

            if (email != null && !email.isBlank() && roleStr != null && !roleStr.isBlank()) {
                Role role = Role.valueOf(roleStr);

                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
                var principal = new AuthPrincipal(userId, email, role, name, lastLogin);

                var authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        authorities
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);

                log.info("[JWT] Auth OK {} {} -> userId={}, email={}, authority={}",
                        request.getMethod(),
                        request.getRequestURI(),
                        userId,
                        email,
                        authorities.get(0).getAuthority()
                );
            } else {
                log.warn("[JWT] Token parsed but missing required claims {} {} (email={}, role={})",
                        request.getMethod(),
                        request.getRequestURI(),
                        email,
                        roleStr
                );
            }

        } catch (Exception e) {
            // Token ungültig -> keine Auth gesetzt
            log.warn("[JWT] TOKEN INVALID {} {} -> {}",
                    request.getMethod(),
                    request.getRequestURI(),
                    e.toString()
            );
        }

        filterChain.doFilter(request, response);
    }
}
