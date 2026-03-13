package org.thomcgn.backend.meldebogen.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.meldebogen.dto.MeldebogenListItemResponse;
import org.thomcgn.backend.meldebogen.dto.MeldebogenRequest;
import org.thomcgn.backend.meldebogen.dto.MeldebogenResponse;
import org.thomcgn.backend.meldebogen.service.MeldebogenService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{falloeffnungId}/meldeboegen")
public class MeldebogenController {

    private final MeldebogenService service;

    public MeldebogenController(MeldebogenService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MeldebogenListItemResponse>> list(@PathVariable Long falloeffnungId) {
        return ResponseEntity.ok(service.list(falloeffnungId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeldebogenResponse> get(
            @PathVariable Long falloeffnungId, @PathVariable Long id) {
        return ResponseEntity.ok(service.get(falloeffnungId, id));
    }

    @PostMapping
    public ResponseEntity<MeldebogenResponse> create(
            @PathVariable Long falloeffnungId,
            @Valid @RequestBody MeldebogenRequest req) {
        return ResponseEntity.ok(service.create(falloeffnungId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<MeldebogenResponse> update(
            @PathVariable Long falloeffnungId, @PathVariable Long id,
            @Valid @RequestBody MeldebogenRequest req) {
        return ResponseEntity.ok(service.update(falloeffnungId, id, req));
    }
}
