package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.Gender;
import org.thomcgn.backend.people.model.Kind;

import java.time.LocalDate;

public record KindResponse(
        Long id,
        String vorname,
        String nachname,
        LocalDate geburtsdatum,
        Gender gender,
        boolean foerderbedarf,
        String foerderbedarfDetails,
        String gesundheitsHinweise
) {
    private KindResponse toDto(Kind k) {
        return new KindResponse(
                k.getId(),
                k.getVorname(),
                k.getNachname(),
                k.getGeburtsdatum(),
                k.getGender() == null ? Gender.UNBEKANNT : k.getGender(),
                k.isFoerderbedarf(),
                k.getFoerderbedarfDetails(),
                k.getGesundheitsHinweise()
        );
    }
}