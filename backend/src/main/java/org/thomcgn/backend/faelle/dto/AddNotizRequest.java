package org.thomcgn.backend.faelle.dto;

import jakarta.validation.constraints.NotBlank;

public record AddNotizRequest(
        String typ,
        String visibility, // "INTERN" oder "EXTERN" (optional; default INTERN)
        @NotBlank String text
) {}