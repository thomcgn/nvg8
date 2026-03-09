package org.thomcgn.backend.anlass.dto;

public record AnlasskatalogEntryResponse(
        Long id,
        String code,
        String label,
        String category,
        Integer defaultSeverity
) {}
