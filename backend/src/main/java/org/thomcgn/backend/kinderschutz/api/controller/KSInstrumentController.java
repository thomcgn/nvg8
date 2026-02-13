package org.thomcgn.backend.kinderschutz.api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.kinderschutz.api.dto.*;
import org.thomcgn.backend.kinderschutz.catalog.*;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSInstrumentRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/ks/instruments")
public class KSInstrumentController {

    private final KSInstrumentRepository instrumentRepo;

    @GetMapping("/{code}/{version}")
    public KSInstrumentDTO getInstrument(@PathVariable String code, @PathVariable String version) {
        KSInstrument inst = instrumentRepo.findByCodeAndVersion(code, version)
                .orElseThrow(() -> new NoSuchElementException("Instrument not found"));

        // Sections sind flat + parent_id => wir bauen Tree
        List<KSSection> all = inst.getSections().stream()
                .sorted(Comparator.comparing(KSSection::getOrderIndex))
                .toList();

        Map<Long, KSSectionDTOBuilder> map = new HashMap<>();
        for (KSSection s : all) map.put(s.getId(), new KSSectionDTOBuilder(s));

        List<KSSectionDTOBuilder> roots = new ArrayList<>();
        for (KSSection s : all) {
            KSSectionDTOBuilder b = map.get(s.getId());
            if (s.getParent() == null) roots.add(b);
            else map.get(s.getParent().getId()).children.add(b);
        }

        List<KSSectionDTO> tree = roots.stream()
                .sorted(Comparator.comparingInt(b -> b.orderIndex))
                .map(KSSectionDTOBuilder::build)
                .toList();

        return new KSInstrumentDTO(
                inst.getId(),
                inst.getCode(),
                inst.getTitel(),
                inst.getTyp().name(),
                inst.getVersion(),
                inst.getApplicability() != null ? inst.getApplicability().getMinAgeMonths() : null,
                inst.getApplicability() != null ? inst.getApplicability().getMaxAgeMonths() : null,
                inst.getApplicability() != null ? inst.getApplicability().getRequiresSchoolContext() : false,
                inst.getApplicability() != null ? inst.getApplicability().getRequiresKitaContext(): false,
                tree
        );
    }

    // --- kleine lokale Builderklasse
    static class KSSectionDTOBuilder {
        Long id;
        String sectionNo;
        String title;
        Integer orderIndex;
        String hintText;
        List<KSItemDTO> items;
        List<KSSectionDTOBuilder> children = new ArrayList<>();

        KSSectionDTOBuilder(KSSection s) {
            this.id = s.getId();
            this.sectionNo = s.getSectionNo();
            this.title = s.getTitle();
            this.orderIndex = s.getOrderIndex() != null ? s.getOrderIndex() : 0;
            this.hintText = s.getHintText();
            this.items = s.getItems().stream()
                    .sorted(Comparator.comparing(KSItem::getOrderIndex))
                    .map(i -> new KSItemDTO(
                            i.getId(),
                            i.getItemNo(),
                            i.getText(),
                            i.getAnswerType(),
                            i.getOrderIndex(),
                            i.getPolarity(),       // falls du Polarity noch am Item ergänzt
                            i.isAkutKriterium()
                    ))
                    .collect(Collectors.toList());
        }

        KSSectionDTO build() {
            List<KSSectionDTO> childDtos = children.stream()
                    .sorted(Comparator.comparingInt(b -> b.orderIndex))
                    .map(KSSectionDTOBuilder::build)
                    .toList();
            return new KSSectionDTO(id, sectionNo, title, orderIndex, hintText, items, childDtos);
        }
    }
}
