package org.thomcgn.backend.people.dto;

import org.thomcgn.backend.people.model.BezugspersonBeziehung;
import org.thomcgn.backend.people.model.Gender;

import java.time.LocalDate;

public record CreateBezugspersonRequest(
        String vorname,
        String nachname,
        LocalDate geburtsdatum,
        Gender gender,
        String telefon,
        String kontaktEmail,
        String strasse,
        String hausnummer,
        String plz,
        String ort,
        BezugspersonBeziehung beziehung
) {}