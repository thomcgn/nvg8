package org.thomcgn.backend.users.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.users.dto.UserListItemResponse;
import org.thomcgn.backend.users.service.UserQueryService;

import java.util.List;

@RestController
@RequestMapping("/admin/org-units")
public class UserQueryAdminController {

    private final UserQueryService userQueryService;

    public UserQueryAdminController(UserQueryService userQueryService) {
        this.userQueryService = userQueryService;
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @GetMapping("/{orgUnitId}/users")
    public ResponseEntity<List<UserListItemResponse>> list(@PathVariable Long orgUnitId) {
        return ResponseEntity.ok(userQueryService.listUsersForOrgUnit(orgUnitId));
    }
}