package org.thomcgn.backend.falloeffnungen.erstmeldung.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.falloeffnungen.erstmeldung.dto.*;
import org.thomcgn.backend.falloeffnungen.erstmeldung.service.ErstmeldungService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{fallId}/erstmeldung")
public class ErstmeldungController {

    private final ErstmeldungService service;

    public ErstmeldungController(ErstmeldungService service) {
        this.service = service;
    }

    @GetMapping("/current")
    public ResponseEntity<ErstmeldungResponse> current(@PathVariable Long fallId) {
        return ResponseEntity.ok(service.getCurrent(fallId));
    }

    @GetMapping("/versions")
    public ResponseEntity<List<ErstmeldungVersionListItemResponse>> versions(@PathVariable Long fallId) {
        return ResponseEntity.ok(service.listVersions(fallId));
    }

    @GetMapping("/{erstmeldungId}")
    public ResponseEntity<ErstmeldungResponse> get(@PathVariable Long fallId, @PathVariable Long erstmeldungId) {
        return ResponseEntity.ok(service.getById(fallId, erstmeldungId));
    }

    @PostMapping("/new-version")
    public ResponseEntity<ErstmeldungResponse> newVersion(@PathVariable Long fallId) {
        return ResponseEntity.ok(service.createNewVersion(fallId));
    }

    @PutMapping("/{erstmeldungId}/draft")
    public ResponseEntity<ErstmeldungResponse> saveDraft(
            @PathVariable Long fallId,
            @PathVariable Long erstmeldungId,
            @Valid @RequestBody ErstmeldungDraftRequest req
    ) {
        return ResponseEntity.ok(service.saveDraft(fallId, erstmeldungId, req));
    }

    @PostMapping("/{erstmeldungId}/submit")
    public ResponseEntity<ErstmeldungResponse> submit(
            @PathVariable Long fallId,
            @PathVariable Long erstmeldungId,
            @RequestBody(required = false) ErstmeldungSubmitRequest req
    ) {
        return ResponseEntity.ok(service.submit(fallId, erstmeldungId, req));
    }
}