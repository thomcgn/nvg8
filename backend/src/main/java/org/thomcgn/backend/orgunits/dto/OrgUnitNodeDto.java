package org.thomcgn.backend.orgunits.dto;

import java.util.List;

public record OrgUnitNodeDto(
        Long id,
        String type,
        String name,
        boolean enabled,
        List<OrgUnitNodeDto> children,
        String strasse,
        String hausnummer,
        String plz,
        String ort,
        String leitung,
        String ansprechpartner
) {}
