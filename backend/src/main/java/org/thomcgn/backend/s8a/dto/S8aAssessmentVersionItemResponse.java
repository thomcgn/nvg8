package org.thomcgn.backend.s8a.dto;

import java.time.Instant;

/**
 * Lightweight-Versionseintrag für eine Versionsliste.
 */
public record S8aAssessmentVersionItemResponse(
        int version,
        String gefaehrdungsart,
        String createdBy,
        Instant createdAt
) {}