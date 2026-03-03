package org.thomcgn.backend.dossiers.dto;

import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungListItemResponse;

import java.time.Instant;
import java.util.List;

public record AkteResponse(
        Long akteId,
        Long kindId,
        String kindName,
        boolean enabled,
        Instant createdAt,
        List<FalleroeffnungListItemResponse> faelle
) {}