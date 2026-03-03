package org.thomcgn.backend.dossiers.dto;

import java.util.List;

public record AkteListResponse(
        List<AkteListItemDto> items,
        long total,
        int page,
        int size
) {}