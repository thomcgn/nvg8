package org.thomcgn.backend.dossiers.dto;

import java.util.List;

public record FallListResponse(
        List<FallListItemDto> items,
        long total
) {}