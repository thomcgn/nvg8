package org.thomcgn.backend.falloeffnungen.dto;

import java.util.List;

public record FalleroeffnungListResponse(
        List<FalleroeffnungListItemResponse> items,
        int page,
        int size,
        long total
) {}