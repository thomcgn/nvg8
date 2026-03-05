package org.thomcgn.backend.support.tickets.dto;

import org.thomcgn.backend.support.tickets.model.SupportTicketCategory;
import org.thomcgn.backend.support.tickets.model.SupportTicketPriority;

public record CreateSupportTicketRequest(
        String title,
        String description,
        SupportTicketCategory category,
        SupportTicketPriority priority,
        String pageUrl,
        String userAgent
) {}