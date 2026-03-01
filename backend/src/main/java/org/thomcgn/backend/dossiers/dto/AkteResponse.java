package org.thomcgn.backend.dossiers.dto;

import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungListItemResponse;

import java.util.List;

public record AkteResponse(
        Long akteId,
        Long kindId,
        String kindName,
        boolean enabled,
        List<FalleroeffnungListItemResponse> faelle
) {}