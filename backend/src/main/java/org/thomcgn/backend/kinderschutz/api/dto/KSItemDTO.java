package org.thomcgn.backend.kinderschutz.api.dto;
import org.thomcgn.backend.kinderschutz.catalog.AnswerType;
public record KSItemDTO(
        Long id,
        String itemNo,
        String text,
        AnswerType answerType,
        Integer orderIndex,
        Polarity polarity,
        Boolean akutKriterium
) {}