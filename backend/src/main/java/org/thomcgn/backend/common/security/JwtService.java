package org.thomcgn.backend.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class JwtService {

    public static final String CLAIM_TYP = "typ";     // "base" | "ctx"
    public static final String CLAIM_UID = "uid";     // user id
    public static final String CLAIM_TID = "tid";     // traeger id (ctx only)
    public static final String CLAIM_OID = "oid";     // active orgUnit id (ctx only)
    public static final String CLAIM_ROLES = "roles"; // list (ctx only)

    private final JwtProperties props;
    private final Key key;

    public JwtService(JwtProperties props) {
        this.props = props;
        this.key = Keys.hmacShaKeyFor(props.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String issueBaseToken(Long userId, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getBaseTtlMinutes() * 60);

        return Jwts.builder()
                .setIssuer(props.getIssuer())
                .setSubject(email)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .addClaims(Map.of(
                        CLAIM_TYP, "base",
                        CLAIM_UID, userId
                ))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String issueContextToken(Long userId, Long traegerId, Long orgUnitId, List<String> roles, String email) {
        Instant now = Instant.now();
        Instant exp = now.plusSeconds(props.getAccessTtlMinutes() * 60);

        return Jwts.builder()
                .setIssuer(props.getIssuer())
                .setSubject(email)
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(exp))
                .addClaims(Map.of(
                        CLAIM_TYP, "ctx",
                        CLAIM_UID, userId,
                        CLAIM_TID, traegerId,
                        CLAIM_OID, orgUnitId,
                        CLAIM_ROLES, roles
                ))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public Jws<Claims> parse(String token) throws JwtException {
        return Jwts.parserBuilder()
                .requireIssuer(props.getIssuer())
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
    }

    public static boolean isContextToken(Claims c) {
        return "ctx".equals(c.get(CLAIM_TYP, String.class));
    }

    public static boolean isBaseToken(Claims c) {
        return "base".equals(c.get(CLAIM_TYP, String.class));
    }
}