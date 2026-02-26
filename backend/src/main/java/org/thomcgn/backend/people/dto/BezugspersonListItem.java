package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record BezugspersonListItem(
        Long id,
        String displayName,
        LocalDate geburtsdatum,
        String telefon,
        String kontaktEmail
) {}