package org.thomcgn.backend.kinderschutz.forms.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.cases.repo.KinderschutzFallRepository;
import org.thomcgn.backend.kinderschutz.api.dto.*;
import org.thomcgn.backend.kinderschutz.api.mapper.KSCatalogMapper;
import org.thomcgn.backend.kinderschutz.catalog.KSInstrument;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;
import org.thomcgn.backend.kinderschutz.catalog.KSSection;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSInstrumentRepository;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSItemRepository;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSSectionRepository;
import org.thomcgn.backend.kinderschutz.forms.model.*;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormAnswerRepository;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormInstanceRepository;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KSFormService {

    private final KinderschutzFallRepository fallRepo;

    private final KSInstrumentRepository instrumentRepo;
    private final KSSectionRepository sectionRepo;
    private final KSItemRepository itemRepo;

    private final KSFormInstanceRepository instanceRepo;
    private final KSFormAnswerRepository answerRepo;

    // ---------- Schema ----------
    public KSInstrumentSchemaDTO loadSchema(String code, String version) {
        KSInstrument inst = instrumentRepo.findByCodeAndVersion(code, version)
                .orElseThrow(() -> new IllegalArgumentException("Instrument nicht gefunden: " + code + "@" + version));

        List<KSSection> sections = sectionRepo.findByInstrument_CodeAndInstrument_VersionOrderByOrderIndexAsc(code, version);
        List<KSItem> items = itemRepo.findBySection_Instrument_CodeAndSection_Instrument_VersionOrderBySection_OrderIndexAscOrderIndexAsc(code, version);

        Map<Long, List<KSItem>> itemsBySectionId = items.stream()
                .collect(Collectors.groupingBy(i -> i.getSection().getId()));

        // Tree bauen: parentId -> children
        Map<Long, List<KSSection>> childrenByParentId = new HashMap<>();
        List<KSSection> roots = new ArrayList<>();

        for (KSSection s : sections) {
            if (s.getParent() == null) roots.add(s);
            else childrenByParentId.computeIfAbsent(s.getParent().getId(), k -> new ArrayList<>()).add(s);
        }

        // sort children by orderIndex
        childrenByParentId.values().forEach(list ->
                list.sort(Comparator.comparing(KSSection::getOrderIndex, Comparator.nullsLast(Integer::compareTo))));

        List<KSSectionDTO> rootDtos = roots.stream()
                .sorted(Comparator.comparing(KSSection::getOrderIndex, Comparator.nullsLast(Integer::compareTo)))
                .map(r -> toSectionTree(r, childrenByParentId, itemsBySectionId))
                .toList();

        return new KSInstrumentSchemaDTO(inst.getCode(), inst.getVersion(), inst.getTitel(), rootDtos);
    }

    private KSSectionDTO toSectionTree(
            KSSection s,
            Map<Long, List<KSSection>> childrenByParentId,
            Map<Long, List<KSItem>> itemsBySectionId
    ) {
        List<KSItemDTO> itemDtos = Optional.ofNullable(itemsBySectionId.get(s.getId()))
                .orElse(List.of()).stream()
                .sorted(Comparator.comparing(KSItem::getOrderIndex, Comparator.nullsLast(Integer::compareTo)))
                .map(KSCatalogMapper::toItemDTO)
                .toList();

        List<KSSectionDTO> childDtos = Optional.ofNullable(childrenByParentId.get(s.getId()))
                .orElse(List.of()).stream()
                .map(ch -> toSectionTree(ch, childrenByParentId, itemsBySectionId))
                .toList();

        return KSCatalogMapper.toSectionDTO(s, itemDtos, childDtos);
    }

    // ---------- Instance erstellen ----------
    @Transactional
    public Long createOrGetDraft(Long fallId, String code, String version) {
        return instanceRepo.findFirstByFall_IdAndInstrumentCodeAndInstrumentVersionOrderByCreatedAtDesc(fallId, code, version)
                .filter(i -> i.getStatus() == FormStatus.DRAFT)
                .map(KSFormInstance::getId)
                .orElseGet(() -> {
                    var fall = fallRepo.findById(fallId).orElseThrow();
                    KSFormInstance inst = new KSFormInstance();
                    inst.setFall(fall);
                    inst.setInstrumentCode(code);
                    inst.setInstrumentVersion(version);
                    inst.setStatus(FormStatus.DRAFT);
                    return instanceRepo.save(inst).getId();
                });
    }

    // ---------- Instance laden (Schema + Antworten) ----------
    public KSFormInstanceDTO loadInstance(Long instanceId) {
        KSFormInstance inst = instanceRepo.findById(instanceId).orElseThrow();
        KSInstrumentSchemaDTO schema = loadSchema(inst.getInstrumentCode(), inst.getInstrumentVersion());

        List<KSAnswerDTO> answers = inst.getAnswers().stream()
                .map(a -> new KSAnswerDTO(
                        a.getItem().getId(),
                        a.getTriState(),
                        a.getValueText(),
                        a.getValueDate(),
                        a.getValueUserRef(),
                        a.getComment()
                ))
                .toList();

        return new KSFormInstanceDTO(
                inst.getId(),
                inst.getFall().getId(),
                inst.getInstrumentCode(),
                inst.getInstrumentVersion(),
                inst.getStatus(),
                answers,
                schema
        );
    }

    // ---------- Speichern ----------
    @Transactional
    public void save(Long instanceId, SaveKSFormDTO dto) {
        KSFormInstance inst = instanceRepo.findById(instanceId).orElseThrow();

        if (inst.getStatus() == FormStatus.SUBMITTED) {
            throw new IllegalStateException("Form ist bereits SUBMITTED und kann nicht mehr geändert werden.");
        }

        // Existing answers map for quick update
        Map<Long, KSFormAnswer> byItemId = inst.getAnswers().stream()
                .collect(Collectors.toMap(a -> a.getItem().getId(), Function.identity()));

        for (KSAnswerDTO a : dto.answers()) {
            if (a.itemId() == null) continue;

            KSFormAnswer entity = byItemId.get(a.itemId());
            if (entity == null) {
                entity = new KSFormAnswer();
                entity.setInstance(inst);

                // lightweight reference
                KSItem itemRef = new KSItem();
                itemRef.setId(a.itemId());
                entity.setItem(itemRef);

                inst.getAnswers().add(entity);
                byItemId.put(a.itemId(), entity);
            }

            entity.setTriState(a.triState());
            entity.setValueText(a.text());
            entity.setValueDate(a.date());
            entity.setValueUserRef(a.userRef());
            entity.setComment(a.comment());
        }

        if (dto.status() != null) {
            inst.setStatus(dto.status());
        }

        instanceRepo.save(inst);
    }
}
