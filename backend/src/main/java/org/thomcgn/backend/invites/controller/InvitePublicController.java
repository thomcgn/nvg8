package org.thomcgn.backend.invites.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.invites.dto.AcceptInviteRequest;
import org.thomcgn.backend.invites.dto.AcceptInviteResponse;
import org.thomcgn.backend.invites.service.InviteService;

@RestController
@RequestMapping("/auth")
public class InvitePublicController {

    private final InviteService inviteService;

    public InvitePublicController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    @PostMapping("/accept-invite")
    public ResponseEntity<AcceptInviteResponse> accept(@Valid @RequestBody AcceptInviteRequest req) {
        return ResponseEntity.ok(inviteService.acceptInvite(req));
    }
}