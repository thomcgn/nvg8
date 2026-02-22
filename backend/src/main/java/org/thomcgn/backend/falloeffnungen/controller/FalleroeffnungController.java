package org.thomcgn.backend.falloeffnungen.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.falloeffnungen.dto.*;
import org.thomcgn.backend.falloeffnungen.service.FalleroeffnungService;

@RestController
@RequestMapping("/falloeffnungen")
public class FalleroeffnungController {

    private final FalleroeffnungService service;

    public FalleroeffnungController(FalleroeffnungService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<FalleroeffnungResponse> create(@Valid @RequestBody CreateFalleroeffnungRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FalleroeffnungResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @GetMapping
    public ResponseEntity<FalleroeffnungListResponse> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            Pageable pageable
    ) {
        return ResponseEntity.ok(service.list(status, q, pageable));
    }

    @PostMapping("/{id}/notizen")
    public ResponseEntity<FalleroeffnungNotizResponse> addNotiz(@PathVariable Long id, @Valid @RequestBody AddNotizRequest req) {
        return ResponseEntity.ok(service.addNotiz(id, req));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<FalleroeffnungResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateFalleroeffnungStatusRequest req) {
        return ResponseEntity.ok(service.updateStatus(id, req));
    }
}