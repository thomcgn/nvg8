package org.thomcgn.backend.falloeffnungen.dto;

import jakarta.validation.constraints.NotNull;

public record CreateFalleroeffnungRequest(
        @NotNull Long kindId,
        @NotNull Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        String titel,
        String kurzbeschreibung
) {}