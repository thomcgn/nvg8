package org.thomcgn.backend.schutzplan.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.schutzplan.dto.SchutzplanListItemResponse;
import org.thomcgn.backend.schutzplan.dto.SchutzplanRequest;
import org.thomcgn.backend.schutzplan.dto.SchutzplanResponse;
import org.thomcgn.backend.schutzplan.service.SchutzplanService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{falloeffnungId}/schutzplaene")
public class SchutzplanController {

    private final SchutzplanService service;

    public SchutzplanController(SchutzplanService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<SchutzplanListItemResponse>> list(@PathVariable Long falloeffnungId) {
        return ResponseEntity.ok(service.list(falloeffnungId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SchutzplanResponse> get(
            @PathVariable Long falloeffnungId, @PathVariable Long id) {
        return ResponseEntity.ok(service.get(falloeffnungId, id));
    }

    @PostMapping
    public ResponseEntity<SchutzplanResponse> create(
            @PathVariable Long falloeffnungId,
            @Valid @RequestBody SchutzplanRequest req) {
        return ResponseEntity.ok(service.create(falloeffnungId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SchutzplanResponse> update(
            @PathVariable Long falloeffnungId, @PathVariable Long id,
            @Valid @RequestBody SchutzplanRequest req) {
        return ResponseEntity.ok(service.update(falloeffnungId, id, req));
    }
}
