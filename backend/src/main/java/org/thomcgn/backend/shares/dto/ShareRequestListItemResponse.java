package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record ShareRequestListItemResponse(
        Long id,
        String status,
        Long fallId,
        String partnerName,
        String legalBasisType,
        String purpose,
        Instant createdAt
) {}