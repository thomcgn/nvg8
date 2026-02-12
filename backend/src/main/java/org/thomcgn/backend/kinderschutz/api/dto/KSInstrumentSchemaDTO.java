package org.thomcgn.backend.kinderschutz.api.dto;

import java.util.List;

public record KSInstrumentSchemaDTO(
        String instrumentCode,
        String instrumentVersion,
        String titel,
        List<KSSectionDTO> sections
) {}