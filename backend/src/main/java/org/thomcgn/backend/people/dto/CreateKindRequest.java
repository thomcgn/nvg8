package org.thomcgn.backend.people.dto;

import java.time.LocalDate;

public record CreateKindRequest(
        String vorname,
        String nachname,
        LocalDate geburtsdatum,
        String gender,              // Gender enum name
        boolean foerderbedarf,
        String foerderbedarfDetails,
        String gesundheitsHinweise
) {}