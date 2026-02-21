package org.thomcgn.backend.faelle.dto;

import java.util.List;

public record FallListResponse(
        List<FallListItemResponse> items,
        int page,
        int size,
        long total
) {}