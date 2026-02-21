package org.thomcgn.backend.tenants.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTraegerRequest(
        @NotBlank String name,
        String kurzcode,      // optional, z.B. "CAR"
        String aktenPrefix    // optional, z.B. "CAR" oder "CARITAS"
) {}