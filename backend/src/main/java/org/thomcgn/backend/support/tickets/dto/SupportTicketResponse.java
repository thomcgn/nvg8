package org.thomcgn.backend.support.tickets.dto;

import org.thomcgn.backend.support.tickets.model.SupportTicket;

import java.time.OffsetDateTime;

public record SupportTicketResponse(
        Long id,
        String title,
        String description,
        String category,
        String priority,
        String status,
        String pageUrl,
        Integer githubIssueNumber,
        String githubIssueUrl,
        OffsetDateTime createdAt
) {
    public static SupportTicketResponse from(SupportTicket t) {
        return new SupportTicketResponse(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                t.getCategory().name(),
                t.getPriority().name(),
                t.getStatus().name(),
                t.getPageUrl(),
                t.getGithubIssueNumber(),
                t.getGithubIssueUrl(),
                t.getCreatedAt()
        );
    }
}