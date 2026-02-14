package org.thomcgn.backend.cases.dto.response;

public record BezugspersonResponse(
        Long id,
        String organisation,
        PersonResponseBase person
) {}