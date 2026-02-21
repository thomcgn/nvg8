package org.thomcgn.backend.faelle.dto;

import java.time.Instant;

public record FallListItemResponse(
        Long id,
        String status,
        String titel,
        Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        String createdByDisplayName,
        Instant createdAt
) {}