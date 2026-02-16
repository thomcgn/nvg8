package org.thomcgn.backend.cases.api.kws.dto;

import org.thomcgn.backend.cases.model.kws.KwsAnswerType;

public record ItemDto(
        Long id,
        String itemKey,
        String label,
        KwsAnswerType answerType,
        int sort
) {
}
