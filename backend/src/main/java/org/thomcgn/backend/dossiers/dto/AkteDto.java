package org.thomcgn.backend.dossiers.dto;

public record AkteDto(
        Long id,
        Long kindId,
        String kindName,
        String createdAt
) {}