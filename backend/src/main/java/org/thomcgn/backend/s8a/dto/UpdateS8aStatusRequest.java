package org.thomcgn.backend.s8a.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateS8aStatusRequest(
        @NotBlank String status
) {}