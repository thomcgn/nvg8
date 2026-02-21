package org.thomcgn.backend.invites.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.invites.dto.CreateInviteRequest;
import org.thomcgn.backend.invites.dto.CreateInviteResponse;
import org.thomcgn.backend.invites.service.InviteService;

@RestController
@RequestMapping("/admin/invites")
public class InviteAdminController {

    private final InviteService inviteService;

    public InviteAdminController(InviteService inviteService) {
        this.inviteService = inviteService;
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PostMapping
    public ResponseEntity<CreateInviteResponse> create(@Valid @RequestBody CreateInviteRequest req) {
        return ResponseEntity.ok(inviteService.createInvite(req));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @DeleteMapping("/{inviteId}")
    public ResponseEntity<Void> revoke(@PathVariable Long inviteId) {
        inviteService.revokeInvite(inviteId);
        return ResponseEntity.noContent().build();
    }
}