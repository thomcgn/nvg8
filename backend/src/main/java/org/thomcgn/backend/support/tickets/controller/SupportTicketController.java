package org.thomcgn.backend.support.tickets.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.support.tickets.dto.CountResponse;
import org.thomcgn.backend.support.tickets.dto.CreateSupportTicketRequest;
import org.thomcgn.backend.support.tickets.dto.SupportTicketResponse;
import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;
import org.thomcgn.backend.support.tickets.repo.SupportTicketRepository;
import org.thomcgn.backend.support.tickets.service.SupportTicketService;

import java.util.List;

@RestController
@RequestMapping("/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService supportTicketService;
    private final SupportTicketRepository supportTicketRepository;

    // ✅ already have POST create
    @PostMapping
    public SupportTicketResponse create(
            @org.springframework.security.core.annotation.AuthenticationPrincipal AuthPrincipal user,
            @RequestBody CreateSupportTicketRequest request
    ) {
        var ticket = supportTicketService.createTicket(user.id(), request);
        return SupportTicketResponse.from(ticket);
    }

    @GetMapping("/my")
    public List<SupportTicketResponse> myTickets(
            @org.springframework.security.core.annotation.AuthenticationPrincipal(expression = "toAuthPrincipal()")
            org.thomcgn.backend.auth.dto.AuthPrincipal user
    ) {
        if (user == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED,
                    "Not authenticated"
            );
        }

        return supportTicketRepository
                .findByCreatedByUserIdOrderByCreatedAtDesc(user.id())
                .stream()
                .map(SupportTicketResponse::from)
                .toList();
    }

    // ✅ neu: GET /support/tickets/my/count?status=OPEN
    @GetMapping("/my/count")
    public CountResponse myTicketsCount(
            @org.springframework.security.core.annotation.AuthenticationPrincipal AuthPrincipal user,
            @RequestParam(name = "status", required = false) SupportTicketStatus status
    ) {
        if (status == null) {
            // Optional: wenn kein Status angegeben: count OPEN + IN_PROGRESS
            long open = supportTicketRepository.countByCreatedByUserIdAndStatus(user.id(), SupportTicketStatus.OPEN);
            long inProgress = supportTicketRepository.countByCreatedByUserIdAndStatus(user.id(), SupportTicketStatus.IN_PROGRESS);
            return new CountResponse(open + inProgress);
        }

        long c = supportTicketRepository.countByCreatedByUserIdAndStatus(user.id(), status);
        return new CountResponse(c);
    }
}