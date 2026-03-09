package org.thomcgn.backend.teams.dto;

public record TeamMemberListItem(
        Long membershipId,
        Long userId,
        String displayName,
        String email,
        String membershipType,
        boolean primary,
        boolean enabled
) {}