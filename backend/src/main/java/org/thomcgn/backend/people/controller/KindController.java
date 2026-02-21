package org.thomcgn.backend.people.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.people.dto.CreateKindRequest;
import org.thomcgn.backend.people.dto.KindResponse;
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

    @GetMapping("/{id}")
    public ResponseEntity<KindResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }
}