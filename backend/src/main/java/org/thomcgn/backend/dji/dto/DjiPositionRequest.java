package org.thomcgn.backend.dji.dto;

import jakarta.validation.constraints.NotBlank;

public record DjiPositionRequest(
        @NotBlank String positionCode,
        String belege,
        Boolean bewertungBool,
        Short bewertungStufe
) {}
