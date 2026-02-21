package org.thomcgn.backend.faelle.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateFallStatusRequest(
        @NotBlank String status
) {}