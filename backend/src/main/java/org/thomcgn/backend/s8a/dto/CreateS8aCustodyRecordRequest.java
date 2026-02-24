package org.thomcgn.backend.s8a.dto;

public record CreateS8aCustodyRecordRequest(
        Long childPersonId,
        Long rightHolderPersonId,
        String custodyType,      // S8aCustodyType
        String residenceRight,   // S8aResidenceDeterminationRight
        String validFrom,
        String validTo,
        String sourceTitle,
        String sourceReference,
        String notes
) {}