package org.thomcgn.backend.users.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;
import org.thomcgn.backend.users.dto.*;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.service.UserAdminService;

@RestController
@RequestMapping("/admin/users")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest req) {
        User u = userAdminService.createUser(req);
        return ResponseEntity.ok(new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.isEnabled()));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PostMapping("/{userId}/roles")
    public ResponseEntity<UserOrgRoleResponse> assignRole(
            @PathVariable Long userId,
            @Valid @RequestBody AssignRoleRequest req
    ) {
        OrgUnitMembership m = userAdminService.assignRole(userId, req);
        return ResponseEntity.ok(toResponse(m));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PutMapping("/{userId}/roles/{membershipId}")
    public ResponseEntity<UserOrgRoleResponse> changeRole(
            @PathVariable Long userId,
            @PathVariable Long membershipId,
            @Valid @RequestBody ChangeRoleRequest req
    ) {
        OrgUnitMembership m = userAdminService.changeRole(userId, membershipId, req);
        return ResponseEntity.ok(toResponse(m));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @DeleteMapping("/{userId}/roles/{membershipId}")
    public ResponseEntity<Void> disableRole(@PathVariable Long userId, @PathVariable Long membershipId) {
        userAdminService.disableRole(userId, membershipId);
        return ResponseEntity.noContent().build();
    }

    private UserOrgRoleResponse toResponse(OrgUnitMembership m) {
        return new UserOrgRoleResponse(
                m.getId(),
                m.getUser().getId(),
                m.getOrgUnit().getId(),
                m.getRole(),
                m.isEnabled()
        );
    }
}
