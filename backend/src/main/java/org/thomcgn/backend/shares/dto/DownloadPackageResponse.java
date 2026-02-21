package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record DownloadPackageResponse(
        Long packageId,
        String partnerName,
        Long fallId,
        Instant expiresAt,
        int downloadsRemaining,
        String payloadJson
) {}