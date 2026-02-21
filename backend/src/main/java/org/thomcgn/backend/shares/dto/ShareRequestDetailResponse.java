package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record ShareRequestDetailResponse(
        Long id,
        String status,
        Long fallId,
        Long partnerId,
        String partnerName,
        String legalBasisType,
        String purpose,
        Instant notesFrom,
        Instant notesTo,
        String requestedByDisplayName,
        Instant createdAt,
        String decisionReason,
        String decidedByDisplayName,
        Instant decidedAt
) {}