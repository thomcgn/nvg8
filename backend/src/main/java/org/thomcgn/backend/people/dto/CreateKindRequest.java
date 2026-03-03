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
        String gesundheitsHinweise,

        // ✅ Adresse (wie Bezugsperson)
        String strasse,
        String hausnummer,
        String plz,
        String ort,

        // ✅ Einrichtung beim Anlegen (optional)
        // - null => nimmt aktive Einrichtung aus dem Context
        // - != null => muss == aktive Einrichtung sein, sonst 403 CONTEXT_REQUIRED
        Long ownerEinrichtungOrgUnitId
) {}