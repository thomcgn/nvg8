package org.thomcgn.backend.users.dto;

public record UserOrgRoleResponse(
        Long id,
        Long userId,
        Long orgUnitId,
        String role,
        boolean enabled
) {}