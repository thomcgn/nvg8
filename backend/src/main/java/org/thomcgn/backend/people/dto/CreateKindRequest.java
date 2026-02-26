package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.Gender;

import java.time.LocalDate;

public record CreateKindRequest(
        String vorname,
        String nachname,
        LocalDate geburtsdatum,
        Gender gender,
        boolean foerderbedarf,
        String foerderbedarfDetails,
        String gesundheitsHinweise
) {}