package org.thomcgn.backend.tenants.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTraegerRiskIndicatorRequest(
        @NotBlank @Size(max = 120) String indicatorId,
        @NotBlank @Size(max = 220) String label,
        String description,
        @Size(max = 120) String category,
        Boolean enabled,
        Integer defaultSeverity
) {}