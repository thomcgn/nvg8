package org.thomcgn.backend.auth.service;

import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.data.User;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.time.LocalDateTime;
import java.time.ZoneId;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String SECRET =
            "BITTE_SEHR_LANGES_SECRET_FUER_MVP_MINDESTENS_32_ZEICHEN";
    private static final long EXPIRATION_MS = 1000 * 60 * 60; // 1h

    private final Key key =
            Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

    // JWT mit optionalem lastLogin
    public String generateToken(User user, LocalDateTime lastLogin) {
        Claims claims = Jwts.claims()
                .setSubject(String.valueOf(user.getId()))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS));

        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());
        claims.put("name", user.getVorname() + " " + user.getNachname());

        if (lastLogin != null) {
            // lastLogin als Epoch Millis
            claims.put("lastLogin", lastLogin.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        }

        return Jwts.builder()
                .setClaims(claims)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
