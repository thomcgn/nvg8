package org.thomcgn.backend.shares.dto;

public record RejectShareRequestResponse(
        Long requestId,
        String status
) {}