package org.thomcgn.backend.s8a.dto;

public record S8aContactRestrictionResponse(
        Long id,
        Long childPersonId,
        Long otherPersonId,
        String restrictionType,
        String reason,
        String validFrom,
        String validTo,
        String sourceTitle,
        String sourceReference
) {}