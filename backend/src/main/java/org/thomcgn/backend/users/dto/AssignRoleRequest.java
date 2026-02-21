package org.thomcgn.backend.users.dto;

import jakarta.validation.constraints.NotNull;

public record AssignRoleRequest(
        @NotNull Long orgUnitId,
        @NotNull String role // z.B. "FACHKRAFT"
) {}