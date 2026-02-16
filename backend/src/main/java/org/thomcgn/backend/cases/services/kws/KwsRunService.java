package org.thomcgn.backend.cases.services.kws;


import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.kws.*;
import org.thomcgn.backend.cases.repo.kws.KwsAnswerRepo;
import org.thomcgn.backend.cases.repo.kws.KwsRunRepo;
import org.thomcgn.backend.cases.repo.kws.KwsTemplateRepo;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.util.List;

@Service
public class KwsRunService {
    private final KwsTemplateRepo templateRepo;
    private final KwsRunRepo runRepo;
    private final KwsAnswerRepo answerRepo;

    public KwsRunService(KwsTemplateRepo templateRepo, KwsRunRepo runRepo, KwsAnswerRepo answerRepo) {
        this.templateRepo = templateRepo;
        this.runRepo = runRepo;
        this.answerRepo = answerRepo;
    }

    public static int monthsBetween(LocalDate birthDate, LocalDate now) {
        if (birthDate == null) return 0;
        Period p = Period.between(birthDate, now);
        return p.getYears() * 12 + p.getMonths();
    }

    @Transactional
    public KwsRun createRun(KwsTemplate template, Kind kind, Long userId, LocalDate assessmentDate,
                            KwsRun parent, KwsRun related, String reason, LocalDate nextReviewDate) {
        KwsRun run = new KwsRun();
        run.setTemplate(template);
        run.setKind(kind);
        run.setCreatedByUserId(userId);
        run.setAssessmentDate(assessmentDate);
        run.setParentRun(parent);
        run.setRelatedRun(related);
        run.setReason(reason);
        run.setNextReviewDate(nextReviewDate);
        run.setStatus(KwsRunStatus.DRAFT);
        return runRepo.save(run);
    }

    @Transactional
    public void saveTriStateAnswers(Long runId, List<UpsertTriStateAnswer> answers) {
        KwsRun run = runRepo.getReferenceById(runId);

        if (run.getStatus() == KwsRunStatus.FINAL) {
            throw new IllegalStateException("Finaler Durchlauf kann nicht überschrieben werden. Bitte Follow-up starten.");
        }

        for (UpsertTriStateAnswer a : answers) {
            KwsAnswer entity = answerRepo.findByRunIdAndItemId(runId, a.itemId())
                    .orElseGet(() -> {
                        KwsAnswer na = new KwsAnswer();
                        na.setRun(run);
                        na.setItem(new KwsTemplateItem());
                        na.getItem().setId(a.itemId()); // reference by id
                        return na;
                    });

            entity.setTriState(a.triState());
            entity.setComment(a.comment());
            entity.setUpdatedAt(OffsetDateTime.now());
            answerRepo.save(entity);
        }
    }

    @Transactional
    public void finalizeRun(Long runId) {
        KwsRun run = runRepo.findById(runId).orElseThrow();
        if (run.getStatus() == KwsRunStatus.FINAL) return;
        run.setStatus(KwsRunStatus.FINAL);
        run.setFinalizedAt(OffsetDateTime.now());
        runRepo.save(run);
    }

    public record UpsertTriStateAnswer(Long itemId, KwsTriState triState, String comment) {}
}