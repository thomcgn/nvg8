package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.BezugspersonBeziehung;
import org.thomcgn.backend.people.model.SorgerechtTyp;

import java.time.LocalDate;

public record KindBezugspersonResponse(
        Long linkId,
        Long bezugspersonId,
        String bezugspersonName,
        // ✅ Adresse
        String strasse,
        String hausnummer,
        String plz,
        String ort,
        BezugspersonBeziehung beziehung,
        SorgerechtTyp sorgerecht,
        LocalDate validFrom,
        LocalDate validTo,
        boolean hauptkontakt,
        boolean lebtImHaushalt,
        boolean enabled
) {}