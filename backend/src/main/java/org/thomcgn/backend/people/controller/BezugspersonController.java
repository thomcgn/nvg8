package org.thomcgn.backend.people.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.people.dto.*;
import org.thomcgn.backend.people.service.BezugspersonService;

@RestController
@RequestMapping("/bezugspersonen")
public class BezugspersonController {

    private final BezugspersonService service;

    public BezugspersonController(BezugspersonService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<BezugspersonResponse> create(@Valid @RequestBody CreateBezugspersonRequest req) {
        return ResponseEntity.ok(service.get(service.createEntity(req).getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BezugspersonResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @GetMapping
    public ResponseEntity<BezugspersonSearchResponse> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false) Long einrichtungId
    ) {
        return ResponseEntity.ok(service.search(q, page, size, einrichtungId));
    }
}