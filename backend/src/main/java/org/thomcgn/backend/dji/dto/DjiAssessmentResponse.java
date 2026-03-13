package org.thomcgn.backend.dji.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record DjiAssessmentResponse(
        Long id,
        Long falloeffnungId,
        String formTyp,
        String formTypLabel,
        LocalDate bewertungsdatum,
        List<DjiPositionResponse> positionen,
        String gesamteinschaetzung,
        String gesamteinschaetzungLabel,
        String gesamtfreitext,
        String createdByDisplayName,
        Instant createdAt,
        Instant updatedAt
) {}
