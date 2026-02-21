package org.thomcgn.backend.faelle.dto;

import jakarta.validation.constraints.NotBlank;

public record AddNotizRequest(
        String typ,
        @NotBlank String text
) {}