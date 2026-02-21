package org.thomcgn.backend.invites.dto;

import jakarta.validation.constraints.NotBlank;

public record AcceptInviteRequest(
        @NotBlank String token,
        @NotBlank String newPassword,
        String vorname,
        String nachname
) {}