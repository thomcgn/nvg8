package org.thomcgn.backend.people.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.people.dto.*;
import org.thomcgn.backend.people.service.KindService;

import java.util.List;

@RestController
@RequestMapping("/kinder")
public class KindController {

    private final KindService service;

    public KindController(KindService service) {
        this.service = service;
    }

    // =====================================================
    // Kind
    // =====================================================

    @PostMapping
    public ResponseEntity<KindResponse> create(@Valid @RequestBody CreateKindRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PostMapping("/complete")
    public ResponseEntity<CreateKindResponse> createComplete(@Valid @RequestBody CreateKindCompleteRequest req) {
        return ResponseEntity.ok(service.createComplete(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KindResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @GetMapping
    public ResponseEntity<KindSearchResponse> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(service.search(q, page, size));
    }

    // =====================================================
    // Bezugspersonen Links
    // =====================================================

    @GetMapping("/{id}/bezugspersonen")
    public ResponseEntity<List<KindBezugspersonResponse>> listBezugspersonen(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive
    ) {
        return ResponseEntity.ok(service.listBezugspersonen(id, includeInactive));
    }

    @PostMapping("/{id}/bezugspersonen")
    public ResponseEntity<KindBezugspersonResponse> addBezugsperson(
            @PathVariable Long id,
            @Valid @RequestBody AddKindBezugspersonRequest req
    ) {
        return ResponseEntity.ok(service.addBezugsperson(id, req));
    }

    @PatchMapping("/{id}/bezugspersonen/{linkId}/end")
    public ResponseEntity<KindBezugspersonResponse> endBezugspersonLink(
            @PathVariable Long id,
            @PathVariable Long linkId,
            @Valid @RequestBody EndKindBezugspersonRequest req
    ) {
        return ResponseEntity.ok(service.endBezugspersonLink(id, linkId, req));
    }
}