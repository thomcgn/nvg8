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

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public Claims getClaims() {
        return claims;
    }

    public boolean isContext() {
        return claims != null && JwtService.isContextToken(claims);
    }

    public boolean isBase() {
        return claims != null && JwtService.isBaseToken(claims);
    }

    public Long getTraegerId() {
        return claims != null ? claims.get(JwtService.CLAIM_TID, Long.class) : null;
    }

    public Long getOrgUnitId() {
        return claims != null ? claims.get(JwtService.CLAIM_OID, Long.class) : null;
    }
}