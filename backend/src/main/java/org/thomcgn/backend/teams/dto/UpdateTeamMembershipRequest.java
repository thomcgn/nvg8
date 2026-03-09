package org.thomcgn.backend.teams.dto;

public record UpdateTeamMembershipRequest(
        String membershipType,
        Boolean primary,
        Boolean enabled
) {}