package org.thomcgn.backend.cases.dto.response;

public record UserSummaryResponse(
        Long id,
        String email,
        String vorname,
        String nachname,
        String role
) {}