package org.thomcgn.backend.support.tickets.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.support.github.GithubClient;
import org.thomcgn.backend.support.tickets.dto.CreateSupportTicketRequest;
import org.thomcgn.backend.support.tickets.model.SupportTicket;
import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;
import org.thomcgn.backend.support.tickets.repo.SupportTicketRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final GithubClient githubClient;

    @Transactional
    public SupportTicket createTicket(Long createdByUserId, CreateSupportTicketRequest req) {

        SupportTicket t = new SupportTicket();
        t.setTitle(req.title());
        t.setDescription(req.description());
        t.setCategory(req.category());
        t.setPriority(req.priority());
        t.setStatus(SupportTicketStatus.OPEN);
        t.setPageUrl(req.pageUrl());
        t.setUserAgent(req.userAgent());
        t.setCreatedAt(OffsetDateTime.now());
        t.setCreatedByUserId(createdByUserId);

        // 1️⃣ zuerst speichern
        t = supportTicketRepository.save(t);

        // 2️⃣ GitHub Issue erstellen
        Map<String,Object> issue = githubClient.createIssue(
                Map.of(
                        "title", "[SUPPORT] " + t.getTitle(),
                        "body", buildGithubBody(t),
                        "labels", List.of("support","status:offen")
                )
        );

        // 3️⃣ GitHub response auslesen
        t.setGithubIssueNumber((Integer) issue.get("number"));
        t.setGithubIssueUrl((String) issue.get("html_url"));

        return supportTicketRepository.save(t);
    }

    private String buildGithubBody(SupportTicket t) {

        StringBuilder sb = new StringBuilder();

        sb.append("Ticket-ID: ").append(t.getId()).append("\n");
        sb.append("Kategorie: ").append(t.getCategory()).append("\n");
        sb.append("Priorität: ").append(t.getPriority()).append("\n");

        if (t.getPageUrl() != null) {
            sb.append("Page: ").append(t.getPageUrl()).append("\n");
        }

        sb.append("\n---\n\n");

        if (t.getDescription() != null) {
            sb.append(t.getDescription()).append("\n");
        }

        if (t.getUserAgent() != null) {
            sb.append("\n---\n");
            sb.append("User-Agent: ").append(t.getUserAgent()).append("\n");
        }

        return sb.toString();
    }

    @Transactional
    public void handleGithubIssueClosed(long issueNumber) {
        // Ticket anhand Issue-Nummer suchen
        var opt = supportTicketRepository.findByGithubIssueNumber(issueNumber);
        if (opt.isEmpty()) return;

        var t = opt.get();

        // auf ERLEDIGT setzen
        t.setStatus(SupportTicketStatus.OPEN);
        supportTicketRepository.save(t);
    }

    @Transactional
    public void handleGithubIssueReopened(long issueNumber) {
        var opt = supportTicketRepository.findByGithubIssueNumber(issueNumber);
        if (opt.isEmpty()) return;

        var t = opt.get();

        // auf OFFEN setzen
        t.setStatus(SupportTicketStatus.CLOSED);
        supportTicketRepository.save(t);
    }
}