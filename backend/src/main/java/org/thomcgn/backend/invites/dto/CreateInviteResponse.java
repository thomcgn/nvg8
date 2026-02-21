package org.thomcgn.backend.invites.dto;

import java.time.Instant;
import java.util.Set;

public record CreateInviteResponse(
        Long inviteId,
        String email,
        Long traegerId,
        Long orgUnitId,
        Set<String> roles,
        Instant expiresAt,
        String inviteUrl,
        String token // nur DEV; in Prod weglassen
) {}