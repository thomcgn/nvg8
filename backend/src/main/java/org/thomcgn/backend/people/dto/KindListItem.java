package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.Gender;

import java.time.LocalDate;

public record KindListItem(
        Long id,
        String displayName,
        LocalDate geburtsdatum,
        Gender gender,
        boolean foerderbedarf
) {}