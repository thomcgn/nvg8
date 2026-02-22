package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record CreateShareRequestRequest(
        Long partnerId,
        Long falleroeffnungId,
        String legalBasisType,
        String purpose,
        Instant notesFrom,
        Instant notesTo
) {}