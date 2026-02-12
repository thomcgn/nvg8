package org.thomcgn.backend.cases.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.cases.dto.DraftRequest;
import org.thomcgn.backend.cases.model.Bezugsperson;
import org.thomcgn.backend.cases.model.Kind;
import org.thomcgn.backend.cases.model.KinderschutzFall;
import org.thomcgn.backend.cases.repo.ErziehungspersonRepository;
import org.thomcgn.backend.cases.repo.KindRepository;
import org.thomcgn.backend.cases.services.FallService;

import java.util.List;

@RestController
@RequestMapping("/cases")
public class CaseController {

    private final FallService fallService;
    private final KindRepository kindRepository;
    private final ErziehungspersonRepository erziehungspersonRepository;

    public CaseController(FallService fallService, KindRepository kindRepository, ErziehungspersonRepository erziehungspersonRepository) {
        this.fallService = fallService;
        this.kindRepository = kindRepository;
        this.erziehungspersonRepository = erziehungspersonRepository;
    }

    // Alle Kinder abrufen (für Wizard Dropdown)
    @GetMapping("/kinder")
    public List<Kind> getAllChildren() {
        return kindRepository.findAll();
    }

    @GetMapping("/erziehungspersonen")
    public List<Bezugsperson> getAllErziehungspersonen(){return erziehungspersonRepository.findAll();}

    // Draft-Fall erstellen
    @PostMapping("/draft")
    public ResponseEntity<KinderschutzFall> createDraft(
            @AuthenticationPrincipal User user,
            @RequestBody DraftRequest request
    ) {
        Kind kind = kindRepository.findById(request.getKindId())
                .orElseThrow(() -> new IllegalArgumentException("Kind nicht gefunden"));

        KinderschutzFall draft = fallService.createDraft(user, kind);
        return ResponseEntity.ok(draft);
    }
}
