package org.thomcgn.backend.auth.dto;

import org.thomcgn.backend.auth.model.Role;

/**
 * Lightweight auth principal derived from the JWT.
 * Purpose: avoid a DB round-trip on every request just to populate the SecurityContext.
 */
public record AuthPrincipal(
        Long id,
        String email,
        Role role,
        String name,
        Long lastLoginEpochMillis
) {
}