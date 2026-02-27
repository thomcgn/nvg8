package org.thomcgn.backend.falloeffnungen.risk.dto;

import java.time.Instant;

public record TraegerRiskMatrixConfigResponse(
        Long id,
        Long traegerId,
        String version,
        boolean active,
        String configJson,
        String createdByDisplayName,
        Instant createdAt
) {}