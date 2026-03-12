package org.thomcgn.backend.messenger.dto;

import java.util.List;

public record SendMessageRequest(
        String subject,
        String body,
        List<Long> recipientUserIds,
        List<Long> recipientOrgUnitIds,
        Long threadId
) {}
