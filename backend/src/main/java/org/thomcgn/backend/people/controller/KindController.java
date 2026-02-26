package org.thomcgn.backend.people.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.people.dto.*;
import org.thomcgn.backend.people.service.KindService;

@RestController
@RequestMapping("/kinder")
public class KindController {

    private final KindService service;

    public KindController(KindService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<KindResponse> create(@Valid @RequestBody CreateKindRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PostMapping("/complete")
    public ResponseEntity<CreateKindResponse> createComplete(@RequestBody CreateKindCompleteRequest req) {
        return ResponseEntity.ok(service.createComplete(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KindResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PostMapping("/{id}/bezugspersonen")
    public ResponseEntity<KindBezugspersonResponse> addBezugsperson(
            @PathVariable Long id,
            @RequestBody AddKindBezugspersonRequest req
    ) {
        return ResponseEntity.ok(service.addBezugsperson(id, req));
    }

    @PatchMapping("/{id}/bezugspersonen/{linkId}/end")
    public ResponseEntity<KindBezugspersonResponse> endBezugspersonLink(
            @PathVariable Long id,
            @PathVariable Long linkId,
            @RequestBody EndKindBezugspersonRequest req
    ) {
        return ResponseEntity.ok(service.endBezugspersonLink(id, linkId, req));
    }

    @GetMapping("/{id}/bezugspersonen")
    public ResponseEntity<java.util.List<KindBezugspersonResponse>> listActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.listBezugspersonen(id, false));
    }
}