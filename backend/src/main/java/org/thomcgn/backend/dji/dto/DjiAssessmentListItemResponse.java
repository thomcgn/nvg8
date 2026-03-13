package org.thomcgn.backend.dji.dto;

import java.time.Instant;
import java.time.LocalDate;

public record DjiAssessmentListItemResponse(
        Long id,
        Long falloeffnungId,
        String formTyp,
        String formTypLabel,
        LocalDate bewertungsdatum,
        String gesamteinschaetzung,
        String gesamteinschaetzungLabel,
        String createdByDisplayName,
        Instant createdAt
) {}
