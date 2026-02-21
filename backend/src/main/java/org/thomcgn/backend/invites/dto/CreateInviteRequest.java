package org.thomcgn.backend.invites.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record CreateInviteRequest(
        @Email @NotBlank String email,
        @NotNull Long orgUnitId,
        @NotEmpty Set<String> roles,   // ["FACHKRAFT","LESEN"]
        Integer expiresInHours         // optional, default 72
) {}