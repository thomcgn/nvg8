package org.thomcgn.backend.orgunits.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateOrgUnitRequest(
        @NotBlank String name,
        String strasse,
        String hausnummer,
        String plz,
        String ort,
        String leitung,
        String ansprechpartner
) {}
