package org.thomcgn.backend.cases.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.dto.DraftRequest;
import org.thomcgn.backend.cases.model.CaseFile;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.services.CaseService;
import org.thomcgn.backend.cases.repo.KindRepository;

import java.util.List;

@RestController
@RequestMapping("/cases")
public class CaseController {

    private final CaseService caseService;
    private final KindRepository kindRepository;

    public CaseController(CaseService caseService, KindRepository kindRepository) {
        this.caseService = caseService;
        this.kindRepository = kindRepository;
    }

    // Alle Kinder abrufen (für Wizard Dropdown)
    @GetMapping("/kinder")
    public List<Kind> getAllChildren() {
        return kindRepository.findAll();
    }

    // Draft-Fall erstellen
    @PostMapping("/draft")
    public ResponseEntity<CaseFile> createDraft(
            @AuthenticationPrincipal User user,
            @RequestBody DraftRequest request
    ) {
        Kind kind = kindRepository.findById(request.getKindId())
                .orElseThrow(() -> new IllegalArgumentException("Kind nicht gefunden"));

        CaseFile draft = caseService.createDraft(user, kind);
        return ResponseEntity.ok(draft);
    }
}
