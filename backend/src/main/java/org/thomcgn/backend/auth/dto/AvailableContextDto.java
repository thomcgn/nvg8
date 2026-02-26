package org.thomcgn.backend.auth.dto;

public record AvailableContextDto(
        Long traegerId,
        String traegerName,
        Long orgUnitId,
        String orgUnitType,
        String orgUnitName
) {}