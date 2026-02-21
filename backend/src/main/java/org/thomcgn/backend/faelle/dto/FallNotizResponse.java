package org.thomcgn.backend.faelle.dto;

import java.time.Instant;

public record FallNotizResponse(
        Long id,
        String typ,
        String text,
        String createdByDisplayName,
        Instant createdAt
) {}