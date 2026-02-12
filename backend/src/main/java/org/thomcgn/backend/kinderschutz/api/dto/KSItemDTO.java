package org.thomcgn.backend.kinderschutz.api.dto;

public record KSItemDTO(
        Long id,
        String itemNo,
        String text,
        AnswerType answerType,
        Integer orderIndex,
        Polarity polarity,
        Boolean akutKriterium
) {}
