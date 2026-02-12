package org.thomcgn.backend.kinderschutz.api.dto;

import java.util.List;

public record KSInstrumentDTO(
        Long id,
        String code,
        String titel,
        String version,
        String typ,              // oder InstrumentTyp als Enum, wenn du willst
        boolean aktiv,
        ApplicabilityRuleDTO applicability,
        List<KSSectionDTO> sections
) {}
