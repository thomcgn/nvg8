package org.thomcgn.backend.s8a.dto;

import java.time.Instant;

public record S8aCaseListItemResponse(
        Long id,
        String status,
        String riskLevel,
        String title,
        Instant createdAt
) {}