package org.thomcgn.backend.dossiers.dto;

import jakarta.validation.constraints.NotNull;

public record CreateAkteRequest(
        @NotNull Long kindId
) {}