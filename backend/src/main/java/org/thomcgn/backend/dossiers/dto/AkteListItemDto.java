package org.thomcgn.backend.dossiers.dto;

public record AkteListItemDto(
        Long id,
        Long kindId,
        String kindName,
        String createdAt,
        String lastFallAt,
        long fallCount
) {}