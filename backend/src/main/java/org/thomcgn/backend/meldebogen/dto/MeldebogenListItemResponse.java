package org.thomcgn.backend.meldebogen.dto;

import java.time.Instant;
import java.time.LocalDate;

public record MeldebogenListItemResponse(
        Long id,
        Long falloeffnungId,
        LocalDate eingangsdatum,
        String meldungart,
        String ersteinschaetzung,
        String handlungsdringlichkeit,
        String createdByDisplayName,
        Instant createdAt
) {}
