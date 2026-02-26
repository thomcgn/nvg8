package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.BezugspersonBeziehung;
import org.thomcgn.backend.people.model.SorgerechtTyp;

import java.time.LocalDate;

public record AddKindBezugspersonRequest(
        Long existingBezugspersonId,          // optional: vorhandene Bezugsperson referenzieren
        CreateBezugspersonRequest create,     // optional: neue Bezugsperson inline erstellen

        BezugspersonBeziehung beziehung,      // required
        SorgerechtTyp sorgerecht,             // optional -> default UNGEKLAERT
        LocalDate validFrom,                  // optional -> default today
        Boolean hauptkontakt,                 // optional -> default false
        Boolean lebtImHaushalt                // optional -> default false
) {}