package org.thomcgn.backend.orgunits.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrgUnitRequest(
        @NotNull  String type,
        @NotBlank String name,
        @NotNull  Long parentId,
        String strasse,
        String hausnummer,
        String plz,
        String ort,
        String leitung,
        String ansprechpartner
) {}
