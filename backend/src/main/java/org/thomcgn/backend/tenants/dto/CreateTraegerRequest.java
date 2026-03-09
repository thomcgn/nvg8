package org.thomcgn.backend.tenants.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTraegerRequest(
        @NotBlank String name,
        String kurzcode,
        String aktenPrefix,
        String strasse,
        String hausnummer,
        String plz,
        String ort,
        String leitung,
        String ansprechpartner
) {}
