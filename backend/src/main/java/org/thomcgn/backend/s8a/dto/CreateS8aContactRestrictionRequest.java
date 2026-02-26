package org.thomcgn.backend.s8a.dto;

public record CreateS8aContactRestrictionRequest(
        Long childPersonId,
        Long otherPersonId,
        String restrictionType, // S8aContactRestrictionType
        String reason,
        String validFrom,
        String validTo,
        String sourceTitle,
        String sourceReference,
        Long sourceOrderId

) {}