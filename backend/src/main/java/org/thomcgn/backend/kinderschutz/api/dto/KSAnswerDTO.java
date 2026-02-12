package org.thomcgn.backend.kinderschutz.api.dto;


import org.thomcgn.backend.kinderschutz.casework.TriState;

import java.time.LocalDate;

public record KSAnswerDTO(
        Long itemId,
        TriState triState,
        String text,
        LocalDate date,
        String userRef,
        String comment
) {}