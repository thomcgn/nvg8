package org.thomcgn.backend.cases.dto.response;

public record BezugspersonSummaryResponse(
        Long id,
        String vorname,
        String nachname,
        String organisation,

        // aus Person
        String telefon,
        String kontaktEmail,
        String strasse,
        String hausnummer,
        String plz,
        String ort
) {}