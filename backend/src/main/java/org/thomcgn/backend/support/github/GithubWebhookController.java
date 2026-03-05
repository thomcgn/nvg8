package org.thomcgn.backend.support.github;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.thomcgn.backend.support.tickets.service.SupportTicketService;

import java.util.Map;

@RestController
@RequestMapping("/github")
@RequiredArgsConstructor
public class GithubWebhookController {

    private final GithubProperties props;
    private final SupportTicketService ticketService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            HttpServletRequest request,
            @RequestHeader(name = "X-GitHub-Event", required = false) String event,
            @RequestHeader(name = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody Map<String, Object> payload
    ) {
        byte[] rawBody = new byte[0];
        if (request instanceof ContentCachingRequestWrapper w) {
            rawBody = w.getContentAsByteArray();
        }

        if (!GithubWebhookVerifier.verify(props.webhookSecret(), rawBody, signature)) {
            return ResponseEntity.status(401).build();
        }

        if (!"issues".equals(event)) {
            return ResponseEntity.ok().build();
        }

        String action = (String) payload.get("action");
        Map<String, Object> issue = (Map<String, Object>) payload.get("issue");
        if (issue == null) return ResponseEntity.ok().build();

        Object numObj = issue.get("number");
        if (!(numObj instanceof Number n)) return ResponseEntity.ok().build();
        Integer issueNumber = n.intValue();

        if ("closed".equals(action)) {
            ticketService.handleGithubIssueClosed(issueNumber);
        } else if ("reopened".equals(action)) {
            ticketService.handleGithubIssueReopened(issueNumber);
        }

        return ResponseEntity.ok().build();
    }
}