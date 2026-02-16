package org.thomcgn.backend.cases.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.cases.api.mapper.CaseMapper;
import org.thomcgn.backend.cases.dto.BezugspersonCreateRequest;
import org.thomcgn.backend.cases.dto.CreateKindRequest;
import org.thomcgn.backend.cases.dto.DraftRequest;
import org.thomcgn.backend.cases.dto.response.*;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.cases.model.enums.FallStatus;
import org.thomcgn.backend.cases.repo.ErziehungspersonRepository;
import org.thomcgn.backend.cases.repo.KindRepository;
import org.thomcgn.backend.cases.repo.KinderschutzFallRepository;
import org.thomcgn.backend.cases.services.CaseService;
import org.thomcgn.backend.cases.services.FallService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping({"/cases", "/api/cases"})
public class CaseController {

    private final FallService fallService;
    private final CaseService caseService;
    private final KindRepository kindRepository;
    private final ErziehungspersonRepository erziehungspersonRepository;
    private final KinderschutzFallRepository fallRepository;

    public CaseController(
            FallService fallService,
            CaseService caseService,
            KindRepository kindRepository,
            ErziehungspersonRepository erziehungspersonRepository,
            KinderschutzFallRepository fallRepository
    ) {
        this.fallService = fallService;
        this.caseService = caseService;
        this.kindRepository = kindRepository;
        this.erziehungspersonRepository = erziehungspersonRepository;
        this.fallRepository = fallRepository;
    }

    @GetMapping("/kinder")
    public List<KindSummaryResponse> getAllChildren() {
        return kindRepository.findAll().stream()
                .map(CaseMapper::toKindSummary)
                .toList();
    }

    @GetMapping("/erziehungspersonen")
    public List<BezugspersonSummaryResponse> getAllErziehungspersonen() {
        return erziehungspersonRepository.findAll().stream()
                .map(CaseMapper::toBezugspersonSummary)
                .toList();
    }

    @PostMapping("/draft")
    public ResponseEntity<KinderschutzFallResponse> createDraft(
            @AuthenticationPrincipal AuthPrincipal user,
            @RequestBody DraftRequest request
    ) {
        Kind kind = kindRepository.findById(request.getKindId())
                .orElseThrow(() -> new IllegalArgumentException("Kind nicht gefunden"));

        KinderschutzFall draft = fallService.createDraft(user, kind);
        return ResponseEntity.ok(CaseMapper.toFall(draft));
    }

    @PostMapping("/erziehungspersonen")
    public BezugspersonResponse createErziehungsperson(@RequestBody BezugspersonCreateRequest req) {
        return CaseMapper.toBezugsperson(caseService.createBezugsperson(req));
    }

    @PostMapping("/kinder")
    public KindResponse createKind(@RequestBody CreateKindRequest req) {
        return CaseMapper.toKind(caseService.createKind(req));
    }

    @GetMapping("/mine")
    public List<KinderschutzFallResponse> myCases(@AuthenticationPrincipal AuthPrincipal user) {
        String email = user.email();

        return fallRepository.findForDashboardByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(email)
                .stream()
                .map(CaseMapper::toFall)
                .toList();
    }

    @GetMapping("/stats")
    public DashboardStatsResponse stats(@AuthenticationPrincipal AuthPrincipal user) {

        String email = user.email();

        List<KinderschutzFall> mine =
                fallRepository.findByZustaendigeFachkraft_EmailOrderByUpdatedAtDesc(email);

        long offene = mine.stream()
                .filter(f -> f.getStatus() != null)
                .filter(f -> f.getStatus() != FallStatus.ABGESCHLOSSEN)
                .filter(f -> f.getStatus() != FallStatus.ARCHIVIERT)
                .count();

        long akut = mine.stream()
                .filter(f -> f.getStatus() == FallStatus.AKUT)
                .count();

        LocalDateTime since = LocalDateTime.now().minusDays(30);

        long abgeschlossen30 = mine.stream()
                .filter(f -> f.getStatus() == FallStatus.ABGESCHLOSSEN)
                .filter(f -> f.getUpdatedAt() != null && f.getUpdatedAt().isAfter(since))
                .count();

        return new DashboardStatsResponse(offene, akut, abgeschlossen30);
    }
}