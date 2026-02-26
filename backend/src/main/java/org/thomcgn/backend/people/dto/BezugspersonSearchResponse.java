package org.thomcgn.backend.people.dto;

import java.util.List;

public record BezugspersonSearchResponse(
        List<BezugspersonListItem> items
) {}