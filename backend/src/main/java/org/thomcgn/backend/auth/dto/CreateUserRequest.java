package org.thomcgn.backend.auth.dto;

import org.thomcgn.backend.auth.data.Role;

public record CreateUserRequest(
        String email,
        String password,
        String vorname,
        String nachname,
        Role role
) {}