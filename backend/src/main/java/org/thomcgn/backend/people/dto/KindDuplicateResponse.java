package org.thomcgn.backend.people.dto;

import java.util.List;

public record KindDuplicateResponse(
        List<DuplicateItem> items
) {}