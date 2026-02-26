package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import org.thomcgn.backend.auth.model.AuthCookies;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(JwtService jwtService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = resolveToken(request);

        // Kein Token -> normal weiter (public endpoints funktionieren)
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Jws<Claims> jws = jwtService.parse(token);
            Claims c = jws.getBody();

            Long userId = c.get(JwtService.CLAIM_UID, Long.class);
            String email = c.getSubject();

            Collection<? extends GrantedAuthority> authorities = toAuthorities(c);

            var auth = new UsernamePasswordAuthenticationToken(email, null, authorities);
            auth.setDetails(new JwtPrincipal(userId, email, c));

            SecurityContextHolder.getContext().setAuthentication(auth);

            filterChain.doFilter(request, response);

        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            writeUnauthorizedProblem(response, request, "Invalid or expired token.");
        }
    }

    private String resolveToken(HttpServletRequest request) {
        // 1) Header hat Vorrang (für Debug/Swagger/etc.)
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring("Bearer ".length()).trim();
        }

        // 2) Cookie: access bevorzugen, dann base
        String access = readCookie(request, AuthCookies.ACCESS_COOKIE);
        if (access != null && !access.isBlank()) return access;

        String base = readCookie(request, AuthCookies.BASE_COOKIE);
        if (base != null && !base.isBlank()) return base;

        return null;
    }

    private String readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) {
            if (c != null && name.equals(c.getName())) {
                return c.getValue();
            }
        }
        return null;
    }

    private Collection<? extends GrantedAuthority> toAuthorities(Claims c) {
        List<GrantedAuthority> out = new ArrayList<>();

        if (JwtService.isBaseToken(c)) {
            out.add(new SimpleGrantedAuthority("ROLE_AUTHENTICATED"));
            return out;
        }

        if (JwtService.isContextToken(c)) {
            Object rolesObj = c.get(JwtService.CLAIM_ROLES);
            if (rolesObj instanceof List<?> list) {
                for (Object r : list) {
                    if (r != null) out.add(new SimpleGrantedAuthority("ROLE_" + r.toString()));
                }
            }
            out.add(new SimpleGrantedAuthority("ROLE_AUTHENTICATED"));
        }

        return out;
    }

    private void writeUnauthorizedProblem(HttpServletResponse response, HttpServletRequest request, String detail)
            throws IOException {

        if (response.isCommitted()) return;

        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        pd.setTitle(ErrorCode.AUTH_TOKEN_INVALID.name());
        pd.setDetail(detail);
        pd.setProperty("code", ErrorCode.AUTH_TOKEN_INVALID.name());
        pd.setProperty("timestamp", Instant.now());
        pd.setProperty("path", request.getRequestURI());

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType("application/problem+json");
        objectMapper.writeValue(response.getOutputStream(), pd);
    }
}