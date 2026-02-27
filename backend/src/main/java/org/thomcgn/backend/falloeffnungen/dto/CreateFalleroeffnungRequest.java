package org.thomcgn.backend.falloeffnungen.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateFalleroeffnungRequest(
        @NotNull Long kindId,
        @NotNull Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        String titel,
        String kurzbeschreibung,
        List<String> anlassCodes
) {}