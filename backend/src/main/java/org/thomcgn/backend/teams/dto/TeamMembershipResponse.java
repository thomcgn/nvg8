package org.thomcgn.backend.teams.dto;

public record TeamMembershipResponse(
        Long id,
        Long userId,
        Long teamOrgUnitId,
        String teamName,
        String membershipType,
        boolean primary,
        boolean enabled
) {}