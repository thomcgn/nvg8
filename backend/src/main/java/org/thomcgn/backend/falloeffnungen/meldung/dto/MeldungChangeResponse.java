package org.thomcgn.backend.falloeffnungen.meldung.dto;

import java.time.Instant;

public record MeldungChangeResponse(
        Long id,
        String section,
        String fieldPath,
        String oldValue,
        String newValue,
        String reason,
        Instant changedAt,
        String changedByDisplayName
) {}