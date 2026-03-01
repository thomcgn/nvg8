package org.thomcgn.backend.tenants.dto;

public record TraegerRiskIndicatorResponse(
        Long id,
        String indicatorId,
        String label,
        String description,
        String category,
        boolean enabled,
        int sortOrder,
        Short defaultSeverity
) {}