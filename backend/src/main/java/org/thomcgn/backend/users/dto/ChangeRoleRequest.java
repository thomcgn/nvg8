package org.thomcgn.backend.users.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangeRoleRequest(
        @NotBlank String newRole
) {}
