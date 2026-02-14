package org.thomcgn.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
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

    public JwtAuthFilter(JwtService jwtService,
                         UserRepository userRepository) {
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

        // 1) Authorization Header
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

        if (token != null && !token.isBlank()) {
            try {
                var claims = jwtService.parseToken(token);

                // robust: email aus claim oder subject
                String email = claims.get("email", String.class);
                if (email == null || email.isBlank()) {
                    email = claims.getSubject();
                }

                if (email != null && !email.isBlank()) {
                    User user = userRepository.findByEmail(email).orElse(null);

                    if (user != null) {
                        // Authorities für Spring Security
                        var authorities = List.of(
                                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                        );

                        // ✅ Principal = dein User-Entity
                        var authentication = new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                authorities
                        );

                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                }

            } catch (Exception ignored) {
                // Token ungültig -> keine Auth gesetzt
            }
        }

        filterChain.doFilter(request, response);
    }
}