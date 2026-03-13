package org.thomcgn.backend.kinderschutz.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.kinderschutz.dto.*;
import org.thomcgn.backend.kinderschutz.service.KinderschutzbogenService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{falloeffnungId}/kinderschutzbogen")
public class KinderschutzbogenController {

    private final KinderschutzbogenService service;

    public KinderschutzbogenController(KinderschutzbogenService service) {
        this.service = service;
    }

    @GetMapping("/katalog")
    public ResponseEntity<KatalogResponse> katalog(@PathVariable Long falloeffnungId) {
        return ResponseEntity.ok(service.katalog(falloeffnungId));
    }

    @GetMapping
    public ResponseEntity<List<KinderschutzbogenListItemResponse>> list(@PathVariable Long falloeffnungId) {
        return ResponseEntity.ok(service.list(falloeffnungId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<KinderschutzbogenResponse> get(
            @PathVariable Long falloeffnungId,
            @PathVariable Long id) {
        return ResponseEntity.ok(service.get(falloeffnungId, id));
    }

    @PostMapping
    public ResponseEntity<KinderschutzbogenResponse> create(
            @PathVariable Long falloeffnungId,
            @Valid @RequestBody CreateKinderschutzbogenRequest req) {
        return ResponseEntity.ok(service.create(falloeffnungId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<KinderschutzbogenResponse> update(
            @PathVariable Long falloeffnungId,
            @PathVariable Long id,
            @Valid @RequestBody CreateKinderschutzbogenRequest req) {
        return ResponseEntity.ok(service.update(falloeffnungId, id, req));
    }
}
