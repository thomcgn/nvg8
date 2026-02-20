package org.thomcgn.backend.messenger.dto;

public record InboxItemDto(
        long recipientRowId,
        boolean isRead,
        String readAt,
        MessageDto message
) {}