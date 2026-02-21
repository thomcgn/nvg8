package org.thomcgn.backend.shares.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record CreateShareRequestRequest(
        @NotNull Long partnerId,
        @NotNull Long fallId,
        @NotBlank String purpose,
        @NotNull String legalBasisType, // EINWILLIGUNG/AUFGABENERFORDERLICH/NOTFALL/UNKLAR
        Instant notesFrom,
        Instant notesTo
) {}