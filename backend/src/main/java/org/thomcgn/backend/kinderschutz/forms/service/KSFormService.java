package org.thomcgn.backend.kinderschutz.forms.service;

import jakarta.persistence.OptimisticLockException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.kinderschutz.catalog.KSItem;
import org.thomcgn.backend.kinderschutz.catalog.repo.KSItemRepository;
import org.thomcgn.backend.kinderschutz.forms.api.dto.KSAutoSaveRequestDTO;
import org.thomcgn.backend.kinderschutz.forms.api.dto.KSAutoSaveResponseDTO;
import org.thomcgn.backend.kinderschutz.forms.api.dto.KSAnswerUpsertDTO;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswer;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormAnswerRevision;
import org.thomcgn.backend.kinderschutz.forms.model.KSFormInstance;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormAnswerRepository;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormAnswerRevisionRepository;
import org.thomcgn.backend.kinderschutz.forms.repo.KSFormInstanceRepository;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class KSFormService {

    private final KSFormInstanceRepository instanceRepo;
    private final KSFormAnswerRepository answerRepo;
    private final KSFormAnswerRevisionRepository revisionRepo;
    private final KSItemRepository itemRepo;

    /**
     * Autosave:
     * - prüft expectedVersion gegen aktuelle instance.version
     * - upsert answers (unique uq_instance_item)
     * - bump instance.version via JPA @Version
     * - schreibt Snapshot in ks_form_answer_revisions für *alle* (aktuellen) Antworten
     */
    @Transactional
    public KSAutoSaveResponseDTO autosave(KSAutoSaveRequestDTO req) {
        try {
            KSFormInstance instance = instanceRepo.findWithAnswersById(req.instanceId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Form instance not found"));

            Long currentVersion = instance.getVersion();
            if (req.expectedVersion() == null || !Objects.equals(req.expectedVersion(), currentVersion)) {
                // 409: Client hat veralteten Stand
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Version conflict. expected=" + req.expectedVersion() + " current=" + currentVersion
                );
            }

            // Items in einem Rutsch holen
            List<Long> itemIds = req.answers().stream()
                    .map(KSAnswerUpsertDTO::itemId)
                    .filter(Objects::nonNull)
                    .toList();

            Map<Long, KSItem> items = new HashMap<>();
            if (!itemIds.isEmpty()) {
                for (KSItem it : itemRepo.findAllById(itemIds)) {
                    items.put(it.getId(), it);
                }
            }

            // existing answers map
            Map<Long, KSFormAnswer> existing = new HashMap<>();
            for (KSFormAnswer a : instance.getAnswers()) {
                existing.put(a.getItem().getId(), a);
            }

            // upsert answers
            for (KSAnswerUpsertDTO a : req.answers()) {
                KSItem item = items.get(a.itemId());
                if (item == null) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown itemId: " + a.itemId());
                }

                KSFormAnswer answer = existing.get(item.getId());
                if (answer == null) {
                    answer = new KSFormAnswer();
                    answer.setInstance(instance);
                    answer.setItem(item);
                    instance.getAnswers().add(answer);
                    existing.put(item.getId(), answer);
                }
                answer.setValue(a.value());
            }

            // Speichern -> triggert @Version Increment
            instanceRepo.saveAndFlush(instance);

            Long newVersion = instance.getVersion();

            // Snapshot: alle aktuellen Answers (nicht nur geänderte)
            LocalDateTime now = LocalDateTime.now();
            List<KSFormAnswerRevision> revs = new ArrayList<>(instance.getAnswers().size());
            for (KSFormAnswer ans : instance.getAnswers()) {
                KSFormAnswerRevision r = new KSFormAnswerRevision();
                r.setInstance(instance);
                r.setInstanceVersion(newVersion);
                r.setItem(ans.getItem());
                r.setValue(ans.getValue());
                r.setChangedAt(now);
                revs.add(r);
            }
            revisionRepo.saveAll(revs);

            return new KSAutoSaveResponseDTO(instance.getId(), newVersion);

        } catch (OptimisticLockException | OptimisticLockingFailureException e) {
            // Falls paralleles Update trotzdem passiert
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Version conflict (optimistic lock)", e);
        }
    }
}