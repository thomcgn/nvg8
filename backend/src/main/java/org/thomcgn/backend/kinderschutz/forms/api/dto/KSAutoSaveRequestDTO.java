package org.thomcgn.backend.kinderschutz.forms.api.dto;

import java.util.List;

public record KSAutoSaveRequestDTO(
        Long instanceId,
        Long expectedVersion,        // Optimistic Lock von Client
        List<KSAnswerUpsertDTO> answers
) {}