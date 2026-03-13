package org.thomcgn.backend.dji.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateDjiAssessmentRequest(
        @NotBlank String formTyp,
        @NotNull  LocalDate bewertungsdatum,
        @Valid    List<DjiPositionRequest> positionen,
        String gesamteinschaetzung,
        String gesamtfreitext
) {}
