package org.thomcgn.backend.s8a.dto;

public record CreateS8aCustodyRecordCorrectionRequest(
        String custodyType,
        String residenceRight,
        String validFrom,
        String validTo,
        String sourceTitle,
        String sourceReference,
        Long sourceOrderId,
        String notes,
        String correctionReason
) {}