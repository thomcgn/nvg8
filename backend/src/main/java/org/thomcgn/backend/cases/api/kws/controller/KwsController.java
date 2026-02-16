package org.thomcgn.backend.cases.api.kws.controller;


import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.cases.api.kws.dto.DiffEntryDto;
import org.thomcgn.backend.cases.api.kws.dto.ItemDto;
import org.thomcgn.backend.cases.api.kws.dto.SectionDto;
import org.thomcgn.backend.cases.api.kws.dto.TemplateSchemaDto;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.kws.KwsRun;
import org.thomcgn.backend.cases.model.kws.KwsTemplate;
import org.thomcgn.backend.cases.model.kws.KwsTriState;
import org.thomcgn.backend.cases.repo.KindRepository;
import org.thomcgn.backend.cases.repo.kws.*;
import org.thomcgn.backend.cases.services.kws.KwsDiffService;
import org.thomcgn.backend.cases.services.kws.KwsRunService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping({"/kws","/api/kws"})
public class KwsController {

    private final KwsTemplateRepo templateRepo;
    private final KwsRunRepo runRepo;
    private final KwsAnswerRepo answerRepo;
    private final KwsRunService runService;
    private final KwsDiffService diffService;
    private final KwsTemplateSectionRepo sectionRepo;
    private final KwsTemplateItemRepo itemRepo;
    private final KindRepository kindRepo;

    public KwsController(KwsTemplateRepo templateRepo, KwsRunRepo runRepo, KwsAnswerRepo answerRepo,
                         KwsRunService runService, KindRepository kindRepo, KwsDiffService diffService, KwsTemplateSectionRepo sectionRepo, KwsTemplateItemRepo itemRepo) {
        this.templateRepo = templateRepo;
        this.runRepo = runRepo;
        this.answerRepo = answerRepo;
        this.runService = runService;
        this.kindRepo = kindRepo;
        this.diffService = diffService;
        this.sectionRepo = sectionRepo;
        this.itemRepo = itemRepo;
    }

    // 1) Templates passend zum Kind (Alter in Monaten)
    @GetMapping("/templates/applicable")
    public List<KwsTemplate> applicable(@RequestParam Long kindId) {
        Kind kind = kindRepo.findById(kindId).orElseThrow();
        int months = KwsRunService.monthsBetween(kind.getGeburtsdatum(), LocalDate.now());
        return templateRepo.findApplicable(months);
    }

    // 2) Run erstellen
    public record CreateRunRequest(
            String templateCode,
            Long kindId,
            LocalDate assessmentDate,
            Long parentRunId,
            Long relatedRunId,
            String reason,
            LocalDate nextReviewDate
    ) {}

    public record CreateRunResponse(Long runId) {}

    @PostMapping("/runs")
    public CreateRunResponse createRun(@RequestBody CreateRunRequest req) {
        // TODO: userId aus Auth/JWT holen (bei dir über /api/auth/me oder Principal)
        Long userId = 1L; // <- ersetzen!

        Kind kind = kindRepo.findById(req.kindId()).orElseThrow();
        KwsTemplate tpl = templateRepo.findByCode(req.templateCode()).orElseThrow();

        KwsRun parent = (req.parentRunId() == null) ? null : runRepo.findById(req.parentRunId()).orElseThrow();
        KwsRun related = (req.relatedRunId() == null) ? null : runRepo.findById(req.relatedRunId()).orElseThrow();

        KwsRun run = runService.createRun(
                tpl, kind, userId,
                req.assessmentDate() != null ? req.assessmentDate() : LocalDate.now(),
                parent, related, req.reason(), req.nextReviewDate()
        );

        return new CreateRunResponse(run.getId());
    }

    // 3) Answers speichern (TriState bulk)
    public record UpsertTriStateAnswerReq(Long itemId, KwsTriState triState, String comment) {}
    public record SaveAnswersReq(List<UpsertTriStateAnswerReq> answers) {}

    @PutMapping("/runs/{runId}/answers")
    public void saveAnswers(@PathVariable Long runId, @RequestBody SaveAnswersReq req) {
        var list = req.answers().stream()
                .map(a -> new KwsRunService.UpsertTriStateAnswer(a.itemId(), a.triState(), a.comment()))
                .toList();
        runService.saveTriStateAnswers(runId, list);
    }

    // 4) Finalize
    @PostMapping("/runs/{runId}/finalize")
    public void finalizeRun(@PathVariable Long runId) {
        runService.finalizeRun(runId);
    }

    // 5) History
    @GetMapping("/runs")
    public List<KwsRun> history(@RequestParam Long kindId, @RequestParam(required = false) String templateCode) {
        return runRepo.findHistory(kindId, templateCode);
    }

    @GetMapping("/templates/{code}")
    public TemplateSchemaDto templateSchema(@PathVariable String code) {
        KwsTemplate tpl = templateRepo.findByCode(code).orElseThrow();

        var sections = sectionRepo.findByTemplateIdOrderBySortAsc(tpl.getId()).stream()
                .map(sec -> {
                    var items = itemRepo.findBySectionIdOrderBySortAsc(sec.getId()).stream()
                            .map(it -> new ItemDto(
                                    it.getId(),
                                    it.getItemKey(),
                                    it.getLabel(),
                                    it.getAnswerType(),
                                    it.getSort()
                            ))
                            .toList();

                    return new SectionDto(
                            sec.getId(),
                            sec.getSectionKey(),
                            sec.getTitle(),
                            sec.getSort(),
                            items
                    );
                })
                .toList();

        return new TemplateSchemaDto(tpl.getCode(), tpl.getTitle(), tpl.getVersion(), sections);
    }

    @GetMapping("/runs/{runId}/diff")
    public List<DiffEntryDto> diff(@PathVariable Long runId) {
        return diffService.diffAgainstParent(runId);
    }
}