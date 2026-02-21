package org.thomcgn.backend.faelle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateFallRequest(
        @NotNull Long einrichtungOrgUnitId,
        Long teamOrgUnitId,
        @NotBlank String titel,
        String kurzbeschreibung
) {}