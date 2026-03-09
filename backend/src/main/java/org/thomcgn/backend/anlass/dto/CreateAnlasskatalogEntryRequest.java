package org.thomcgn.backend.anlass.dto;

public record CreateAnlasskatalogEntryRequest(
        String code,
        String label,
        String category,
        Integer defaultSeverity
) {}
