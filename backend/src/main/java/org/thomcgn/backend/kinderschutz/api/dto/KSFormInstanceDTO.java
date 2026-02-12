package org.thomcgn.backend.kinderschutz.api.dto;

import org.thomcgn.backend.kinderschutz.forms.model.FormStatus;
import java.util.List;

public record KSFormInstanceDTO(
        Long id,
        Long fallId,
        String instrumentCode,
        String instrumentVersion,
        FormStatus status,
        List<KSAnswerDTO> answers,
        KSInstrumentSchemaDTO schema
) {}