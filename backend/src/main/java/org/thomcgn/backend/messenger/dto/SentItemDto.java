package org.thomcgn.backend.messenger.dto;

public record SentItemDto(
        long messageId,
        String subject,
        String bodyPreview,
        String createdAt,
        int recipientCount,
        String recipientNames
) {}
