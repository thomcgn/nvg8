package org.thomcgn.backend.s8a.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateS8aRiskRequest(
        @NotBlank String riskLevel
) {}