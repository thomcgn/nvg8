package org.thomcgn.backend.kinderschutz.api.dto;

public record CreateKSFormDTO(
        String instrumentCode,
        String instrumentVersion
) {}