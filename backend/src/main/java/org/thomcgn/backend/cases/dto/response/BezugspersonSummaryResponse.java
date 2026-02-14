package org.thomcgn.backend.cases.dto.response;

public record BezugspersonSummaryResponse(
        Long id,
        String vorname,
        String nachname,
        String organisation
) {}