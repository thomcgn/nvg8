package org.thomcgn.backend.common.security;

import io.jsonwebtoken.Claims;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.auth.model.Role;

import java.util.List;

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

    public boolean isSystem() {
        return claims != null && JwtService.isSystemToken(claims);
    }

    public Long getTraegerId() {
        return claims != null ? claims.get(JwtService.CLAIM_TID, Long.class) : null;
    }

    public Long getOrgUnitId() {
        return claims != null ? claims.get(JwtService.CLAIM_OID, Long.class) : null;
    }

    // ✅ Damit Controller weiterhin AuthPrincipal bekommen können
    public AuthPrincipal toAuthPrincipal() {
        Role role = null;

        Object rolesObj = claims.get(JwtService.CLAIM_ROLES);
        if (rolesObj instanceof List<?> list && !list.isEmpty()) {
            // nimm die "erste" Rolle, oder baue dir hier deine Priorität
            try {
                role = Role.valueOf(String.valueOf(list.get(0)));
            } catch (Exception ignore) {}
        }

        String name = claims.get("name", String.class);
        Long lastLoginEpochMillis = claims.get("lastLoginEpochMillis", Long.class);

        return new AuthPrincipal(userId, email, role, name, lastLoginEpochMillis);
    }
}