package org.thomcgn.backend.messenger.dto;

public record MessageDto(
        long id,
        String subject,
        String bodyPreview,
        String createdAt,
        long senderId,
        String senderName
) {}