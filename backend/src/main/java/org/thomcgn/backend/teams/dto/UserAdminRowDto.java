package org.thomcgn.backend.teams.dto;

import java.time.LocalDateTime;

public record UserAdminRowDto(
        Long id,
        String email,
        String vorname,
        String nachname,
        String role,
        LocalDateTime lastLogin,
        java.util.List<TeamDto> teams
) {}
