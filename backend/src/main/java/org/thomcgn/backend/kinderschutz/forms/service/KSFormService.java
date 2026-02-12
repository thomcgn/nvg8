package org.thomcgn.backend.kinderschutz.forms.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.cases.repo.KinderschutzFallRepository;
import org.thomcgn.backend.kinderschutz.catalog.KSInstrument;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSInstrumentRepository;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSItemRepository;
import org.thomcgn.backend.kinderschutz.forms.exceptions.KSVersionConflictException;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswer;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswerRevision;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormInstance;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormStatus;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormAnswerRepository;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormAnswerRevisionRepository;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormInstanceRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class KSFormService {

    private final KSFormInstanceRepository instanceRepo;
    private final KSFormAnswerRepository answerRepo;
    private final KSFormAnswerRevisionRepository revisionRepo;

    private final KSInstrumentRepository instrumentRepo;
    private final KSItemRepository itemRepo;
    private final KinderschutzFallRepository fallRepo;

    @Transactional
    public KSFormInstance getOrCreate(Long fallId, Long instrumentId) {
        return instanceRepo.findByFallIdAndInstrumentId(fallId, instrumentId)
                .orElseGet(() -> {
                    var fall = fallRepo.findById(fallId).orElseThrow();
                    KSInstrument inst = instrumentRepo.findById(instrumentId).orElseThrow();
                    KSFormInstance fi = new KSFormInstance();
                    fi.setFall(fall);
                    fi.setInstrument(inst);
                    fi.setStatus(KSFormStatus.DRAFT);
                    return instanceRepo.save(fi);
                });
    }

    @Transactional
    public long saveAnswers(Long instanceId, long expectedVersion, Map<String, String> answersByItemNo) {
        KSFormInstance inst = instanceRepo.findById(instanceId).orElseThrow();

        // Optimistic check (zusätzlich zur @Version für klaren 409)
        if (inst.getVersion() != null && inst.getVersion() != expectedVersion) {
            throw new KSVersionConflictException(inst.getVersion());
        }

        // Map itemNo -> KSItem (schnell, weil Instrument bereits fest)
        List<KSItem> items = itemRepo.findBySectionInstrumentId(inst.getInstrument().getId());
        Map<String, KSItem> itemByNo = new HashMap<>();
        for (KSItem it : items) itemByNo.put(it.getItemNo(), it);

        // Upsert answers + create revisions (append-only)
        for (var e : answersByItemNo.entrySet()) {
            String itemNo = e.getKey();
            String value = e.getValue(); // String TriState oder Text

            KSItem item = itemByNo.get(itemNo);
            if (item == null) continue; // oder throw

            KSFormAnswer ans = answerRepo.findByInstanceIdAndItemId(instanceId, item.getId())
                    .orElseGet(() -> {
                        KSFormAnswer a = new KSFormAnswer();
                        a.setInstance(inst);
                        a.setItem(item);
                        return a;
                    });

            // Only write if changed (reduziert noise)
            String old = ans.getValue();
            if (Objects.equals(old, value)) continue;

            ans.setValue(value);
            answerRepo.save(ans);

            KSFormAnswerRevision rev = new KSFormAnswerRevision();
            rev.setInstanceId(instanceId);
            rev.setInstanceVersion(expectedVersion + 1); // wir bumpen gleich
            rev.setItem(item);
            rev.setValue(value);
            revisionRepo.save(rev);
        }

        // Touch instance -> bump @Version
        inst.setStatus(inst.getStatus()); // noop, aber dirty-check; alternativ: inst.setUpdatedAt(now)
        KSFormInstance saved = instanceRepo.saveAndFlush(inst);

        return saved.getVersion();
    }
}
