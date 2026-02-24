package org.thomcgn.backend.s8a.dto;

import java.time.Instant;
import java.util.List;

public record S8aAssessmentResponse(
        Long id,
        Long s8aCaseId,
        int version,
        String gefaehrdungsart,
        List<String> beteiligte,
        boolean kindesanhoerung,
        boolean iefkBeteiligt,
        boolean jugendamtInformiert,
        String createdBy,
        Instant createdAt
) {}