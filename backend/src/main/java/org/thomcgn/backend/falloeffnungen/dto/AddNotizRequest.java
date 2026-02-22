package org.thomcgn.backend.falloeffnungen.dto;

import jakarta.validation.constraints.NotBlank;

public record AddNotizRequest(
        String typ,
        @NotBlank String text,
        String visibility // INTERN|SHAREABLE (default INTERN)
) {}