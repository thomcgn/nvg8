package org.thomcgn.backend.orgunits.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateOrgUnitRequest(
        @NotNull String type,     // EINRICHTUNG/TEAM/ABTEILUNG...
        @NotBlank String name,
        @NotNull Long parentId
) {}