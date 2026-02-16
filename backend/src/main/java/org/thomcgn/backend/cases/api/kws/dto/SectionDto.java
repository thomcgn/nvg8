package org.thomcgn.backend.cases.api.kws.dto;

import java.util.List;

public record SectionDto(
        Long id,
        String sectionKey,
        String title,
        int sort,
        List<ItemDto> items
) {
}
