package org.thomcgn.backend.users.dto;

import java.util.List;

public record OrgUnitUserResponse(
        Long id,
        String email,
        String displayName,
        boolean enabled,
        List<RoleAssignment> roleAssignments
) {
    public record RoleAssignment(Long id, String role) {}
}
