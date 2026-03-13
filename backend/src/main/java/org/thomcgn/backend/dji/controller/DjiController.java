package org.thomcgn.backend.dji.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.dji.dto.*;
import org.thomcgn.backend.dji.service.DjiService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{falloeffnungId}/dji")
public class DjiController {

    private final DjiService service;

    public DjiController(DjiService service) {
        this.service = service;
    }

    /** Liste aller verfügbaren Formtypen (keine Authentifizierung nötig). */
    @GetMapping("/formtypen")
    public ResponseEntity<DjiFormTypListResponse> formTypen() {
        return ResponseEntity.ok(service.formTypen());
    }

    /** Katalog-Items für einen bestimmten Formtyp. */
    @GetMapping("/katalog")
    public ResponseEntity<DjiKatalogResponse> katalog(
            @PathVariable Long falloeffnungId,
            @RequestParam String formTyp) {
        return ResponseEntity.ok(service.katalog(falloeffnungId, formTyp));
    }

    @GetMapping
    public ResponseEntity<List<DjiAssessmentListItemResponse>> list(@PathVariable Long falloeffnungId) {
        return ResponseEntity.ok(service.list(falloeffnungId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<DjiAssessmentResponse> get(
            @PathVariable Long falloeffnungId,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.get(falloeffnungId, id));
    }

    @PostMapping
    public ResponseEntity<DjiAssessmentResponse> create(
            @PathVariable Long falloeffnungId,
            @Valid @RequestBody CreateDjiAssessmentRequest req) {
        return ResponseEntity.ok(service.create(falloeffnungId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DjiAssessmentResponse> update(
            @PathVariable Long falloeffnungId,
            @PathVariable Long id,
            @Valid @RequestBody CreateDjiAssessmentRequest req) {
        return ResponseEntity.ok(service.update(falloeffnungId, id, req));
    }
}
