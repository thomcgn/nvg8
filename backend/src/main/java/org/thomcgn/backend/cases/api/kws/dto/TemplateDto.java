package org.thomcgn.backend.cases.api.kws.dto;


import org.thomcgn.backend.cases.model.kws.KwsAudience;

import java.util.List;

public record TemplateDto(
        Long id,
        String code,
        String title,
        String version,
        Integer minAgeMonths,
        Integer maxAgeMonths,
        KwsAudience audience,
        boolean active,
        List<SectionDto> sections,
        String ageRange
) {}

