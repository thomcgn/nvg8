package org.thomcgn.backend.falloeffnungen.meldung.dto;

import java.time.Instant;

public record MeldungListItemResponse(
        Long id,
        int versionNo,
        boolean current,
        String status,
        String type,
        Instant createdAt,
        String createdByDisplayName,
        Long supersedesId,
        Long correctsId
) {}