package org.thomcgn.backend.common.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;

public final class SecurityUtils {

    private SecurityUtils() {}

    // ---------------------------
    // Core accessors
    // ---------------------------

    public static Authentication authentication() {
        return SecurityContextHolder.getContext().getAuthentication();
    }

    public static JwtPrincipal principalOptional() {
        Authentication auth = authentication();
        if (auth == null) return null;

        Object p = auth.getPrincipal();
        if (p instanceof JwtPrincipal jp) return jp;

        // Fallback: manche Setups packen es in details
        Object d = auth.getDetails();
        if (d instanceof JwtPrincipal jp) return jp;

        return null;
    }

    public static JwtPrincipal principal() {
        JwtPrincipal jp = principalOptional();
        if (jp == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing JwtPrincipal in security context");
        }
        return jp;
    }

    // ---------------------------
    // Simple fields
    // ---------------------------

    public static Long currentUserId() {
        return principal().getUserId();
    }

    public static String currentEmail() {
        return principal().getEmail();
    }

    // ---------------------------
    // Context (traeger/orgUnit)
    // ---------------------------

    public static Long currentTraegerIdOptional() {
        JwtPrincipal p = principalOptional();
        if (p == null) return null;
        return p.getTraegerId();
    }

    public static Long currentOrgUnitIdOptional() {
        JwtPrincipal p = principalOptional();
        if (p == null) return null;
        return p.getOrgUnitId();
    }

    public static Long currentTraegerIdRequired() {
        Long tid = currentTraegerIdOptional();
        if (tid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Context required (missing traegerId)");
        }
        return tid;
    }

    public static Long currentOrgUnitIdRequired() {
        Long oid = currentOrgUnitIdOptional();
        if (oid == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Context required (missing orgUnitId)");
        }
        return oid;
    }

    // ---------------------------
    // Roles
    // ---------------------------

    public static List<String> currentRolesOptional() {
        Authentication auth = authentication();
        if (auth == null) return Collections.emptyList();

        return auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
    }
}