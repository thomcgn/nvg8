package org.thomcgn.backend.shares.dto;

import jakarta.validation.constraints.NotBlank;

public record RejectShareRequestRequest(
        @NotBlank String decisionReason
) {}