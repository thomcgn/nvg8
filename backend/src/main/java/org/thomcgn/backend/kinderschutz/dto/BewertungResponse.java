package org.thomcgn.backend.kinderschutz.dto;

public record BewertungResponse(
        String itemCode,
        String itemLabel,
        String bereich,
        Short rating,
        String notiz
) {}
