package org.thomcgn.backend.shares.dto;

import jakarta.validation.constraints.NotBlank;

public record ApproveShareRequestRequest(
        Integer expiresInDays,   // default 7
        Integer maxDownloads,    // default 5
        @NotBlank String decisionReason
) {}