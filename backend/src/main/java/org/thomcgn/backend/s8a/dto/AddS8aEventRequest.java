package org.thomcgn.backend.s8a.dto;

import jakarta.validation.constraints.NotBlank;

public record AddS8aEventRequest(
        @NotBlank String type,       // S8aEventType
        String payloadJson,
        String text
) {}