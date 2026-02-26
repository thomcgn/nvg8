package org.thomcgn.backend.s8a.dto;

public record CreateS8aContactRestrictionCorrectionRequest(
        String restrictionType,
        String reason,
        String validFrom,
        String validTo,
        String sourceTitle,
        String sourceReference,
        Long sourceOrderId,
        String correctionReason
) {}