package org.thomcgn.backend.dossiers.dto;

public record FallListItemDto(
        Long id,
        Integer fallNo,
        String aktenzeichen,
        String status,
        String openedAt,
        String createdAt
) {}