package org.thomcgn.backend.people.dto;

import java.time.LocalDate;
import java.util.List;

public record BezugspersonListItem(
        Long id,
        String displayName,
        LocalDate geburtsdatum,
        String telefon,
        String kontaktEmail,
        List<KindMini> kinder
) {}