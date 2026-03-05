package org.thomcgn.backend.support.tickets.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.messenger.service.MessageService;
import org.thomcgn.backend.config.SupportProperties;
import org.thomcgn.backend.support.github.GithubService;
import org.thomcgn.backend.support.tickets.dto.CreateSupportTicketRequest;
import org.thomcgn.backend.support.tickets.model.*;
import org.thomcgn.backend.support.tickets.repo.SupportTicketRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository ticketRepository;
    private final GithubService githubService;

    // optional (In-App Inbox Notifications)
    private final MessageService messageService;
    private final SupportProperties supportProperties;

    @Transactional
    public SupportTicket createTicket(Long userId, CreateSupportTicketRequest req) {

        SupportTicket ticket = SupportTicket.builder()
                .createdByUserId(userId)
                .title(req.title())
                .description(req.description())
                .category(req.category() != null ? req.category() : SupportTicketCategory.OTHER)
                .priority(req.priority() != null ? req.priority() : SupportTicketPriority.MEDIUM)
                .status(SupportTicketStatus.OPEN)
                .pageUrl(req.pageUrl())
                .userAgent(req.userAgent())
                .build();

        // erst speichern -> ID im GitHub Issue Body referenzieren
        ticket = ticketRepository.save(ticket);

        String ghTitle = "[Support][" + ticket.getCategory() + "] " + ticket.getTitle();

        String ghBody = """
                ## Problem
                %s

                ## Seite
                %s

                ## User-Agent
                %s

                ## Ticket-ID (System)
                %s

                ## Meta
                Priority: %s
                UserId: %s
                """.formatted(
                ticket.getDescription(),
                ticket.getPageUrl() == null ? "-" : ticket.getPageUrl(),
                ticket.getUserAgent() == null ? "-" : ticket.getUserAgent(),
                ticket.getId(),
                ticket.getPriority(),
                userId
        );

        List<String> labels = List.of(
                "support",
                "priority:" + ticket.getPriority().name().toLowerCase(),
                "area:app"
        );

        GithubService.CreatedIssue created = githubService.createIssue(ghTitle, ghBody, labels);

        ticket.setGithubIssueNumber(created.number());
        ticket.setGithubIssueUrl(created.url());
        ticket.setGithubIssueState("open");

        ticket = ticketRepository.save(ticket);

        // In-App Message: Ticket erstellt
        sendInApp(userId,
                "✅ Ticket erstellt (#" + ticket.getGithubIssueNumber() + ")",
                "Wir haben dein Ticket erhalten:\n\n" +
                        ticket.getTitle() + "\n\n" +
                        (ticket.getGithubIssueUrl() != null ? "GitHub: " + ticket.getGithubIssueUrl() : "")
        );

        return ticket;
    }

    @Transactional
    public void handleGithubIssueClosed(Integer issueNumber) {
        SupportTicket ticket = ticketRepository.findByGithubIssueNumber(issueNumber).orElse(null);
        if (ticket == null) return;

        ticket.setGithubIssueState("closed");

        // “closed” in GitHub heißt bei euch wahrscheinlich “gelöst”
        if (ticket.getStatus() != SupportTicketStatus.RESOLVED && ticket.getStatus() != SupportTicketStatus.CLOSED) {
            ticket.setStatus(SupportTicketStatus.RESOLVED);
        }

        ticketRepository.save(ticket);

        sendInApp(ticket.getCreatedByUserId(),
                "✅ Ticket gelöst (#" + issueNumber + ")",
                "Dein Ticket wurde als gelöst markiert:\n\n" + ticket.getTitle()
        );
    }

    @Transactional
    public void handleGithubIssueReopened(Integer issueNumber) {
        SupportTicket ticket = ticketRepository.findByGithubIssueNumber(issueNumber).orElse(null);
        if (ticket == null) return;

        ticket.setGithubIssueState("open");
        ticket.setStatus(SupportTicketStatus.OPEN);
        ticketRepository.save(ticket);
    }

    private void sendInApp(Long recipientUserId, String subject, String body) {
        Long senderId = supportProperties.systemSenderId() != null ? supportProperties.systemSenderId() : recipientUserId;

        // Wenn du MessageService später entfernen willst: hier ist die einzige Stelle.
        messageService.sendMessage(
                senderId,
                subject,
                body,
                List.of(recipientUserId),
                null
        );
    }
}