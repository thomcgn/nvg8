package org.thomcgn.backend.kinderschutz.api.dto;

import java.util.List;

public record KSSectionDTO(
        Long id,
        String sectionNo,
        String title,
        Integer orderIndex,
        String hintText,
        List<KSItemDTO> items,
        List<KSSectionDTO> children
) {
    public int orderIndexSafe() {
        return orderIndex == null ? 0 : orderIndex;
    }
}