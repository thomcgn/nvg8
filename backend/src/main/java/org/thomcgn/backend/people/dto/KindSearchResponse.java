package org.thomcgn.backend.people.dto;

import java.util.List;

public record KindSearchResponse(
        List<KindListItem> items,
        long total,
        int page,
        int size
) {}