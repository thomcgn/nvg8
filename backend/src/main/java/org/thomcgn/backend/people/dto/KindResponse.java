package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record KindResponse(
        Long id,
        String vorname,
        String nachname,
        LocalDate geburtsdatum,
        String gender,
        boolean foerderbedarf,
        String foerderbedarfDetails,
        String gesundheitsHinweise
) {}