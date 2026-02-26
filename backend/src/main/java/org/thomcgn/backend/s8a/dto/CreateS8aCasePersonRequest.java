package org.thomcgn.backend.s8a.dto;

public record CreateS8aCasePersonRequest(
        String personType,     // S8aPersonType
        String displayName,
        String firstName,
        String lastName,
        String dateOfBirth,
        String notes,
        Long externalPersonRef
) {}