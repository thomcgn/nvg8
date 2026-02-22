package org.thomcgn.backend.falloeffnungen.dto;

import java.time.Instant;

public record FalleroeffnungListItemResponse(
        Long id,
        String status,
        String titel,
        String aktenzeichen,
        Long dossierId,
        Long kindId,
        String kindName,
        Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        String createdByDisplayName,
        Instant createdAt
) {}