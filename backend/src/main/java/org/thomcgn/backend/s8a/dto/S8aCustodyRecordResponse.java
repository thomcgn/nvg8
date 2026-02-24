package org.thomcgn.backend.s8a.dto;

public record S8aCustodyRecordResponse(
        Long id,
        Long childPersonId,
        Long rightHolderPersonId,
        String custodyType,
        String residenceRight,
        String validFrom,
        String validTo,
        String sourceTitle,
        String sourceReference,
        Long sourceOrderId,
        String notes
) {}