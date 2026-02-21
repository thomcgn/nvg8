package org.thomcgn.backend.tenants.dto;

public record TraegerResponse(
        Long id,
        String name,
        String kurzcode,
        String aktenPrefix,
        boolean enabled
) {}