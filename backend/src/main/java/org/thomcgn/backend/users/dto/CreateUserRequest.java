package org.thomcgn.backend.users.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(
        @Email @NotBlank String email,
        @NotBlank String initialPassword,
        String vorname,
        String nachname
) {}