package org.thomcgn.backend.s8a.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.service.S8aService;

@RestController
@RequestMapping("/s8a")
public class S8aController {

    private final S8aService service;

    public S8aController(S8aService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<S8aCaseResponse> create(@Valid @RequestBody CreateS8aCaseRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<S8aCaseResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PostMapping("/{id}/events")
    public ResponseEntity<S8aEventResponse> addEvent(@PathVariable Long id, @Valid @RequestBody AddS8aEventRequest req) {
        return ResponseEntity.ok(service.addEvent(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<S8aCaseResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateS8aStatusRequest req) {
        return ResponseEntity.ok(service.updateStatus(id, req));
    }

    @PatchMapping("/{id}/risk-level")
    public ResponseEntity<S8aCaseResponse> updateRisk(@PathVariable Long id, @Valid @RequestBody UpdateS8aRiskRequest req) {
        return ResponseEntity.ok(service.updateRisk(id, req));
    }

    @GetMapping("/by-fall/{fallId}")
    public ResponseEntity<java.util.List<S8aCaseListItemResponse>> listByFall(@PathVariable Long fallId) {
        return ResponseEntity.ok(service.listByFall(fallId));
    }
}