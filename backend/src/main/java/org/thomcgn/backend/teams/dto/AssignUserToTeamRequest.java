package org.thomcgn.backend.teams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AssignUserToTeamRequest(
        @NotNull Long userId,
        @NotNull Long teamOrgUnitId,
        @NotBlank String membershipType,
        Boolean primary
) {}