package org.thomcgn.backend.auth.dto;

import org.thomcgn.backend.auth.data.Role;

import java.time.LocalDateTime;

public record UserAdminResponse(
        Long id,
        String email,
        String vorname,
        String nachname,
        Role role,
        LocalDateTime lastLogin
) {}