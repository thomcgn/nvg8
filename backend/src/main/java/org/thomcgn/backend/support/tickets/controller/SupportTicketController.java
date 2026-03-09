package org.thomcgn.backend.support.tickets.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.common.security.JwtPrincipal;
import org.thomcgn.backend.support.tickets.dto.CountResponse;
import org.thomcgn.backend.support.tickets.dto.CreateSupportTicketRequest;
import org.thomcgn.backend.support.tickets.dto.SupportTicketResponse;
import org.thomcgn.backend.support.tickets.model.SupportTicketStatus;
import org.thomcgn.backend.support.tickets.repo.SupportTicketRepository;
import org.thomcgn.backend.support.tickets.service.SupportTicketService;

import org.springframework.http.ResponseEntity;

import java.util.List;

@RestController
@RequestMapping("/support/tickets")
@RequiredArgsConstructor
public class SupportTicketController {

    private final SupportTicketService supportTicketService;
    private final SupportTicketRepository supportTicketRepository;

    @PostMapping
    public SupportTicketResponse create(
            @org.springframework.security.core.annotation.AuthenticationPrincipal JwtPrincipal user,
            @RequestBody CreateSupportTicketRequest request
    ) {
        var ticket = supportTicketService.createTicket(user.getUserId(), request);
        return SupportTicketResponse.from(ticket);
    }

    @GetMapping("/my")
    public List<SupportTicketResponse> myTickets(
            @org.springframework.security.core.annotation.AuthenticationPrincipal JwtPrincipal user
    ) {
        return supportTicketRepository
                .findByCreatedByUserIdOrderByCreatedAtDesc(user.getUserId())
                .stream()
                .map(SupportTicketResponse::from)
                .toList();
    }

    // ✅ GET /support/tickets/my/count?status=OPEN
    @GetMapping("/my/count")
    public CountResponse myTicketsCount(
            @org.springframework.security.core.annotation.AuthenticationPrincipal JwtPrincipal user,
            @RequestParam(name = "status", required = false) SupportTicketStatus status
    ) {
        if (status == null) {
            long open = supportTicketRepository.countByCreatedByUserIdAndStatus(user.getUserId(), SupportTicketStatus.OPEN);
            long inProgress = supportTicketRepository.countByCreatedByUserIdAndStatus(user.getUserId(), SupportTicketStatus.IN_PROGRESS);
            return new CountResponse(open + inProgress);
        }

        long c = supportTicketRepository.countByCreatedByUserIdAndStatus(user.getUserId(), status);
        return new CountResponse(c);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @org.springframework.security.core.annotation.AuthenticationPrincipal JwtPrincipal user,
            @PathVariable Long id
    ) {
        supportTicketService.deleteTicket(id, user.getUserId());
        return ResponseEntity.noContent().build();
    }
}