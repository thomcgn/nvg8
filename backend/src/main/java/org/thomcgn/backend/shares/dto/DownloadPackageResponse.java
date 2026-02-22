package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record DownloadPackageResponse(
        Long packageId,
        String status,
        Long shareRequestId,
        Instant expiresAt,
        int downloadCount,
        String payloadJson
) {}