package org.thomcgn.backend.shares.dto;

public record CreateShareRequestResponse(
        Long requestId,
        String status
) {}