package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record ShareRequestListItemResponse(
        Long id,
        String status,
        Long partnerId,
        String partnerName,
        Long falloeffnungId,
        String aktenzeichen,
        Instant createdAt
) {}