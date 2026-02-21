package org.thomcgn.backend.users.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.users.dto.*;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.service.UserAdminService;

@RestController
@RequestMapping("/admin/users")
public class UserAdminController {

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService) {
        this.userAdminService = userAdminService;
    }

    // Nur Admins (Träger oder Einrichtung) – ctx ist ohnehin global erzwungen
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
        UserOrgRole uor = userAdminService.assignRole(userId, req);
        return ResponseEntity.ok(new UserOrgRoleResponse(
                uor.getId(),
                uor.getUser().getId(),
                uor.getOrgUnit().getId(),
                uor.getRole().name(),
                uor.isEnabled()
        ));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @DeleteMapping("/{userId}/roles/{userOrgRoleId}")
    public ResponseEntity<Void> disableRole(@PathVariable Long userId, @PathVariable Long userOrgRoleId) {
        userAdminService.disableRole(userId, userOrgRoleId);
        return ResponseEntity.noContent().build();
    }
}