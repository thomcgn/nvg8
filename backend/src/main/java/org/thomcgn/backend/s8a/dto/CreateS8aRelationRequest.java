package org.thomcgn.backend.s8a.dto;

public record CreateS8aRelationRequest(
        Long fromPersonId,
        Long toPersonId,
        String relationType, // S8aRelationshipType
        String notes
) {}