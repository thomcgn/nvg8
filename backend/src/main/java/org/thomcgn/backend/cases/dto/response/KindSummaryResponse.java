package org.thomcgn.backend.cases.dto.response;

public record KindSummaryResponse(
        Long id,
        String vorname,
        String nachname,
        String geburtsdatum
) {}