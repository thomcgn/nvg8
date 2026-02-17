package org.thomcgn.backend.cases.api.kws.dto;

import java.util.List;

public record TemplateSchemaDto(
        String code,
        String title,
        String version,
        String ageRange,
        List<SectionDto> sections
) {

}