package org.thomcgn.backend.shares.dto;

import java.time.Instant;

public record ApproveShareRequestResponse(
        Long packageId,
        Instant expiresAt,
        String accessUrl,
        String token // DEV only
) {}