package org.thomcgn.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.repositories.UserRepository;
import org.thomcgn.backend.auth.service.JwtService;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String token = null;

        /* -------------------------------------------------
         * 1️⃣ JWT aus Authorization-Header lesen (optional)
         *    Unterstützt z.B. Postman / Swagger
         * ------------------------------------------------- */
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        /* -------------------------------------------------
         * 2️⃣ Falls kein Header vorhanden:
         *    JWT aus HTTP-only Cookie lesen (Standard für Web)
         * ------------------------------------------------- */
        if (token == null && request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("token".equals(cookie.getName())) {
                    token = cookie.getValue();
                    break;
                }
            }
        }

        /* -------------------------------------------------
         * 3️⃣ Token validieren und SecurityContext setzen
         * ------------------------------------------------- */
        if (token != null) {
            try {
                var claims = jwtService.parseToken(token);

                Long userId = Long.parseLong(claims.getSubject());
                User user = userRepository.findById(userId).orElse(null);

                if (user != null) {
                    var authorities = List.of(
                            new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                    );

                    var authentication = new UsernamePasswordAuthenticationToken(
                            user,
                            null,
                            authorities
                    );

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }

            } catch (Exception e) {
                // Token ungültig / abgelaufen → keine Authentifizierung
                // Request läuft weiter, aber als "anonym"
            }
        }

        /* -------------------------------------------------
         * 4️⃣ Request an nächsten Filter weiterreichen
         * ------------------------------------------------- */
        filterChain.doFilter(request, response);
    }
}
