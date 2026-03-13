package org.thomcgn.backend.kinderschutz.dto;

import jakarta.validation.constraints.NotBlank;

public record BewertungRequest(
        @NotBlank String itemCode,
        Short rating,   // -2, -1, 1, 2 oder null (nicht bewertet)
        String notiz
) {}
