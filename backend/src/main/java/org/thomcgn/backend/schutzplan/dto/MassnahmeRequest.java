package org.thomcgn.backend.schutzplan.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record MassnahmeRequest(
        @NotBlank String massnahme,
        String verantwortlich,
        LocalDate bisDatum,
        String status
) {}
