package org.thomcgn.backend.auth.dto;

public record AvailableContextDto(
        Long traegerId,
        Long orgUnitId,
        String orgUnitType,
        String orgUnitName
) {}