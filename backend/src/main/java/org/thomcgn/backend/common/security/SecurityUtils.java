package org.thomcgn.backend.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {
    private SecurityUtils() {}

    public static JwtPrincipal principal() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getDetails() == null) throw new IllegalStateException("Not authenticated");
        return (JwtPrincipal) a.getDetails();
    }

    public static Long currentUserId() { return principal().getUserId(); }
    public static String currentEmail() { return principal().getEmail(); }

    public static Long currentTraegerIdRequired() {
        JwtPrincipal p = principal();
        if (!p.isContext()) throw new IllegalStateException("Context token required");
        return p.getTraegerId();
    }

    public static Long currentOrgUnitIdRequired() {
        JwtPrincipal p = principal();
        if (!p.isContext()) throw new IllegalStateException("Context token required");
        return p.getOrgUnitId();
    }
}