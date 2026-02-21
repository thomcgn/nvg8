package org.thomcgn.backend.faelle.controller;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.faelle.dto.*;
import org.thomcgn.backend.faelle.service.FallService;

@RestController
@RequestMapping("/faelle")
public class FallController {

    private final FallService fallService;

    public FallController(FallService fallService) {
        this.fallService = fallService;
    }

    @PostMapping
    public ResponseEntity<FallResponse> create(@Valid @RequestBody CreateFallRequest req) {
        return ResponseEntity.ok(fallService.create(req));
    }

    @GetMapping("/{fallId}")
    public ResponseEntity<FallResponse> get(@PathVariable Long fallId) {
        return ResponseEntity.ok(fallService.get(fallId));
    }

    @PostMapping("/{fallId}/notizen")
    public ResponseEntity<FallNotizResponse> addNotiz(@PathVariable Long fallId, @Valid @RequestBody AddNotizRequest req) {
        return ResponseEntity.ok(fallService.addNotiz(fallId, req));
    }

    @PatchMapping("/{fallId}/status")
    public ResponseEntity<FallResponse> updateStatus(@PathVariable Long fallId, @Valid @RequestBody UpdateFallStatusRequest req) {
        return ResponseEntity.ok(fallService.updateStatus(fallId, req));
    }

    @GetMapping
    public ResponseEntity<FallListResponse> list(@RequestParam(required = false) String status,
                                                 @RequestParam(required = false) String q,
                                                 @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(fallService.list(status, q, pageable));
    }
}