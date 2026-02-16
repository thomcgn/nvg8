package org.thomcgn.backend.cases.services.kws;


import org.springframework.stereotype.Service;
import org.thomcgn.backend.cases.api.kws.dto.DiffEntryDto;
import org.thomcgn.backend.cases.model.kws.KwsAnswer;
import org.thomcgn.backend.cases.model.kws.KwsRun;
import org.thomcgn.backend.cases.model.kws.KwsTriState;
import org.thomcgn.backend.cases.repo.kws.KwsAnswerRepo;
import org.thomcgn.backend.cases.repo.kws.KwsRunRepo;

import java.util.*;

@Service
public class KwsDiffService {
    private final KwsRunRepo runRepo;
    private final KwsAnswerRepo answerRepo;

    public KwsDiffService(KwsRunRepo runRepo, KwsAnswerRepo answerRepo) {
        this.runRepo = runRepo;
        this.answerRepo = answerRepo;
    }

    public List<DiffEntryDto> diffAgainstParent(Long runId) {
        KwsRun run = runRepo.findById(runId).orElseThrow();
        if (run.getParentRun() == null) return List.of();

        Long parentId = run.getParentRun().getId();

        Map<Long, KwsAnswer> parentAnswers = new HashMap<>();
        for (var a : answerRepo.findByRunId(parentId)) parentAnswers.put(a.getItem().getId(), a);

        List<DiffEntryDto> diffs = new ArrayList<>();
        for (var after : answerRepo.findByRunId(runId)) {
            var before = parentAnswers.get(after.getItem().getId());

            KwsTriState b = before != null ? before.getTriState() : null;
            KwsTriState a = after.getTriState();

            if (!Objects.equals(b, a)) {
                diffs.add(new DiffEntryDto(
                        after.getItem().getId(),
                        after.getItem().getItemKey(),
                        after.getItem().getLabel(),
                        b,
                        a
                ));
            }
        }
        return diffs;
    }
}