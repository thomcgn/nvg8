package org.thomcgn.backend.s8a.dto;

public record S8aRelationResponse(
        Long id,
        Long fromPersonId,
        Long toPersonId,
        String relationType,
        String notes
) {}