package org.thomcgn.backend.falloeffnungen.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFalleroeffnungStatusRequest(
        @NotBlank String status
) {}