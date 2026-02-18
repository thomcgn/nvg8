package org.thomcgn.backend.cases.api.kws.dto;

import org.thomcgn.backend.cases.model.kws.KwsAudience;

public record TemplateListEntryDto(
        String code,
        String title,
        String version,
        KwsAudience audience,
        boolean active,
        String ageRange
) {}