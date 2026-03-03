package org.thomcgn.backend.dossiers.dto;

import java.util.List;

public record CreateFallInAkteRequest(
        String titel,
        String kurzbeschreibung,
        Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        List<String> anlassCodes
) {}