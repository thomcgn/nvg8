package org.thomcgn.backend.kinderschutz.api.dto;

import java.util.List;

public record KSInstrumentDTO(
        Long id,
        String code,
        String titel,
        String typ,
        String version,
        Integer minAgeMonths,
        Integer maxAgeMonths,
        Boolean requiresSchoolContext,
        Boolean requiresKitaContext,
        List<KSSectionDTO> sections
) {}
