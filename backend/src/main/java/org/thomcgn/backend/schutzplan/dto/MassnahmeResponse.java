package org.thomcgn.backend.schutzplan.dto;

import java.time.LocalDate;

public record MassnahmeResponse(
        Long id,
        short position,
        String massnahme,
        String verantwortlich,
        LocalDate bisDatum,
        String status
) {}
