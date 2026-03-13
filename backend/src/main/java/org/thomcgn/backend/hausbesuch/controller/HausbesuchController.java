package org.thomcgn.backend.hausbesuch.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.hausbesuch.dto.HausbesuchListItemResponse;
import org.thomcgn.backend.hausbesuch.dto.HausbesuchRequest;
import org.thomcgn.backend.hausbesuch.dto.HausbesuchResponse;
import org.thomcgn.backend.hausbesuch.service.HausbesuchService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{falloeffnungId}/hausbesuche")
public class HausbesuchController {

    private final HausbesuchService service;

    public HausbesuchController(HausbesuchService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<HausbesuchListItemResponse>> list(@PathVariable Long falloeffnungId) {
        return ResponseEntity.ok(service.list(falloeffnungId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HausbesuchResponse> get(
            @PathVariable Long falloeffnungId, @PathVariable Long id) {
        return ResponseEntity.ok(service.get(falloeffnungId, id));
    }

    @PostMapping
    public ResponseEntity<HausbesuchResponse> create(
            @PathVariable Long falloeffnungId,
            @Valid @RequestBody HausbesuchRequest req) {
        return ResponseEntity.ok(service.create(falloeffnungId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<HausbesuchResponse> update(
            @PathVariable Long falloeffnungId, @PathVariable Long id,
            @Valid @RequestBody HausbesuchRequest req) {
        return ResponseEntity.ok(service.update(falloeffnungId, id, req));
    }
}
