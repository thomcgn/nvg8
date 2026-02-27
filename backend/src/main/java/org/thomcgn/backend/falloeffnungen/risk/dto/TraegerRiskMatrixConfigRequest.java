package org.thomcgn.backend.falloeffnungen.risk.dto;

import jakarta.validation.constraints.NotBlank;

public record TraegerRiskMatrixConfigRequest(
        @NotBlank String version,
        @NotBlank String configJson,
        boolean active
) {}