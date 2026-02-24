package org.thomcgn.backend.s8a.dto;

public record S8aCasePersonResponse(
        Long id,
        Long s8aCaseId,
        String personType,
        String displayName,
        String firstName,
        String lastName,
        String dateOfBirth,
        String notes,
        Long externalPersonRef
) {}