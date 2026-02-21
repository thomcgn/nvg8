package org.thomcgn.backend.common.security;

import io.jsonwebtoken.Claims;

public class JwtPrincipal {
    private final Long userId;
    private final String email;
    private final Claims claims;

    public JwtPrincipal(Long userId, String email, Claims claims) {
        this.userId = userId;
        this.email = email;
        this.claims = claims;
    }

    public Long getUserId() { return userId; }
    public String getEmail() { return email; }
    public Claims getClaims() { return claims; }

    public boolean isContext() { return JwtService.isContextToken(claims); }
    public Long getTraegerId() { return claims.get(JwtService.CLAIM_TID, Long.class); }
    public Long getOrgUnitId() { return claims.get(JwtService.CLAIM_OID, Long.class); }
}