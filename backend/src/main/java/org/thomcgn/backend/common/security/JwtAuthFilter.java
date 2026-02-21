package org.thomcgn.backend.common.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
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
import org.thomcgn.backend.common.errors.ErrorCode;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String header = request.getHeader(HttpHeaders.AUTHORIZATION);

        // Kein Token -> normal weiter (public endpoints funktionieren)
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring("Bearer ".length()).trim();

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
            // Token vorhanden, aber ungültig -> 401 sofort (kein Weiterleiten)
            SecurityContextHolder.clearContext();
            writeUnauthorizedProblem(response, request, "Invalid or expired token.");
        }
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