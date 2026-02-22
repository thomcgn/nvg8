package org.thomcgn.backend.falloeffnungen.dto;

import java.time.Instant;

public record FalleroeffnungNotizResponse(
        Long id,
        String typ,
        String text,
        String createdByDisplayName,
        Instant createdAt
) {}