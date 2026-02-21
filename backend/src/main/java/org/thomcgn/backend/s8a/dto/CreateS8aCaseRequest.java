package org.thomcgn.backend.s8a.dto;

import jakarta.validation.constraints.NotNull;

public record CreateS8aCaseRequest(
        @NotNull Long fallId,
        String title
) {}