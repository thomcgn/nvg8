package org.thomcgn.backend.messenger.dto;

import java.util.List;

public record MessageDetailDto(
        long messageId,
        String subject,
        String body,
        String createdAt,
        long senderId,
        String senderName,
        Long recipientRowId,
        Boolean isRead,
        List<String> recipientNames
) {}
