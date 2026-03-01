package org.thomcgn.backend.common.security;

import io.jsonwebtoken.Claims;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.util.Collections;
import java.util.List;
import java.util.Set;

public final class SecurityUtils {

    private SecurityUtils() {}

    // Wird von AuthQueryService benutzt
    public static JwtPrincipal principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getDetails() == null) {
            throw DomainException.unauthorized(ErrorCode.AUTH_REQUIRED, "Not authenticated");
        }
        if (!(auth.getDetails() instanceof JwtPrincipal p)) {
            throw DomainException.unauthorized(ErrorCode.AUTH_REQUIRED, "Missing JwtPrincipal in security context");
        }
        return p;
    }

    private static Claims claimsRequired() {
        Claims c = principal().getClaims();
        if (c == null) throw DomainException.unauthorized(ErrorCode.AUTH_REQUIRED, "Missing JWT claims");
        return c;
    }

    // ---------- User ----------
    public static Long currentUserId() {
        Long uid = principal().getUserId();
        if (uid == null) throw DomainException.unauthorized(ErrorCode.AUTH_REQUIRED, "User ID missing");
        return uid;
    }

    public static String currentEmail() {
        String email = principal().getEmail();
        if (email == null) throw DomainException.unauthorized(ErrorCode.AUTH_REQUIRED, "Email missing");
        return email;
    }

    // ---------- Traeger ----------
    public static Long currentTraegerIdOptional() {
        return principal().getTraegerId();
    }

    public static Long currentTraegerIdRequired() {
        Long tid = currentTraegerIdOptional();
        if (tid == null) throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No active traeger in context");
        return tid;
    }

    // ---------- OrgUnit ----------
    public static Long currentOrgUnitIdOptional() {
        return principal().getOrgUnitId();
    }

    public static Long currentOrgUnitIdRequired() {
        Long oid = currentOrgUnitIdOptional();
        if (oid == null) throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No active org unit in context");
        return oid;
    }

    /**
     * ✅ Minimal-scope helper:
     * Solange das JWT keine Liste "allowed orgUnits" enthält, scopen wir auf die aktive OrgUnit im Kontext.
     * Später kannst du hier problemlos auf ein Claim-basiertes Set upgraden.
     */
    public static Set<Long> currentOrgUnitIdsScoped() {
        return Set.of(currentOrgUnitIdRequired());
    }

    // ---------- Roles ----------
    @SuppressWarnings("unchecked")
    public static List<String> currentRolesOptional() {
        Object raw = claimsRequired().get(JwtService.CLAIM_ROLES);
        if (raw instanceof List<?> list) {
            return (List<String>) list;
        }
        return Collections.emptyList();
    }
}