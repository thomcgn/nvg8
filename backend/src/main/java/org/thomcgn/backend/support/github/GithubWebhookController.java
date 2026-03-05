package org.thomcgn.backend.support.github;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.support.tickets.service.SupportTicketService;

@RestController
@RequestMapping("/github")
@RequiredArgsConstructor
public class GithubWebhookController {

    private final GithubWebhookVerifier verifier;
    private final SupportTicketService supportTicketService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestHeader(value = "X-GitHub-Event", required = false) String event,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody byte[] rawBody
    ) {
        verifier.verify(signature, rawBody);

        // parse once
        JsonNode root = verifier.parse(rawBody);

        // We only care about issue events
        if (!"issues".equalsIgnoreCase(event)) return ResponseEntity.ok().build();

        String action = root.path("action").asText("");
        long issueNumber = root.path("issue").path("number").asLong(0);

        if (issueNumber <= 0) return ResponseEntity.ok().build();

        switch (action) {
            case "closed" -> supportTicketService.handleGithubIssueClosed(issueNumber);
            case "reopened" -> supportTicketService.handleGithubIssueReopened(issueNumber);
            default -> { /* ignore */ }
        }

        return ResponseEntity.ok().build();
    }
}