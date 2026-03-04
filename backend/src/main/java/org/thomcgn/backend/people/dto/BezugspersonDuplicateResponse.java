package org.thomcgn.backend.people.dto;

import java.util.List;

public record BezugspersonDuplicateResponse(
        List<DuplicateItem> items
) {}