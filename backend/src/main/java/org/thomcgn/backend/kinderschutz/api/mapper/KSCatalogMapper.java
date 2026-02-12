package org.thomcgn.backend.kinderschutz.api.mapper;


import org.thomcgn.backend.kinderschutz.api.dto.KSItemDTO;
import org.thomcgn.backend.kinderschutz.api.dto.KSSectionDTO;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;
import org.thomcgn.backend.kinderschutz.catalog.KSSection;

import java.util.List;

public final class KSCatalogMapper {
    private KSCatalogMapper(){}

    public static KSItemDTO toItemDTO(KSItem i) {
        return new KSItemDTO(
                i.getId(),
                i.getItemNo(),
                i.getText(),
                i.getAnswerType(),
                i.getOrderIndex(),
                i.getPolarity(),// falls du polarity im Item ergänzt hast: i.getPolarity()
                i.isAkutKriterium()
        );
    }

    public static KSSectionDTO toSectionDTO(KSSection s, List<KSItemDTO> items, List<KSSectionDTO> children) {
        return new KSSectionDTO(
                s.getId(),
                s.getSectionNo(),
                s.getTitle(),
                s.getOrderIndex(),
                s.getHintText(),
                items,
                children
        );
    }
}
