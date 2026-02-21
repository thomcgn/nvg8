package org.thomcgn.backend.s8a.dto;

import java.time.Instant;

public record S8aEventResponse(
        Long id,
        String type,
        String text,
        String payloadJson,
        String createdByDisplayName,
        Instant createdAt
) {}