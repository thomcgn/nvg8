package org.thomcgn.backend.teams.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.teams.dto.AssignUserToTeamRequest;
import org.thomcgn.backend.teams.dto.TeamMemberListItem;
import org.thomcgn.backend.teams.dto.TeamMembershipResponse;
import org.thomcgn.backend.teams.dto.UpdateTeamMembershipRequest;
import org.thomcgn.backend.teams.service.TeamMembershipService;

import java.util.List;

@RestController
@RequestMapping("/admin/team-memberships")
public class TeamMembershipAdminController {

    private final TeamMembershipService service;

    public TeamMembershipAdminController(TeamMembershipService service) {
        this.service = service;
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PostMapping
    public ResponseEntity<TeamMembershipResponse> assign(@Valid @RequestBody AssignUserToTeamRequest req) {
        return ResponseEntity.ok(service.assign(req));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @GetMapping("/teams/{teamOrgUnitId}/members")
    public ResponseEntity<List<TeamMemberListItem>> listMembers(@PathVariable Long teamOrgUnitId) {
        return ResponseEntity.ok(service.listMembers(teamOrgUnitId));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @GetMapping("/users/{userId}")
    public ResponseEntity<List<TeamMembershipResponse>> listForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(service.listForUser(userId));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PatchMapping("/{membershipId}")
    public ResponseEntity<TeamMembershipResponse> update(
            @PathVariable Long membershipId,
            @RequestBody UpdateTeamMembershipRequest req
    ) {
        return ResponseEntity.ok(service.update(membershipId, req));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @DeleteMapping("/{membershipId}")
    public ResponseEntity<Void> disable(@PathVariable Long membershipId) {
        service.disable(membershipId);
        return ResponseEntity.noContent().build();
    }
}