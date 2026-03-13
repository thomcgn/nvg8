package org.thomcgn.backend.hausbesuch.dto;

import java.time.Instant;
import java.time.LocalDate;

public record HausbesuchListItemResponse(
        Long id,
        Long falloeffnungId,
        LocalDate besuchsdatum,
        String einschaetzungAmpel,
        String createdByDisplayName,
        Instant createdAt
) {}
