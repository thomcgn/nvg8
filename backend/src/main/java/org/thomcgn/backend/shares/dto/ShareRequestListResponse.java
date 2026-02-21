package org.thomcgn.backend.shares.dto;

import java.util.List;

public record ShareRequestListResponse(
        List<ShareRequestListItemResponse> items,
        int page,
        int size,
        long total
) {}