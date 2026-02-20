package org.thomcgn.backend.messenger.dto;

public record MarkReadRequest(
        Long recipientRowId,
        boolean isRead
) {}
