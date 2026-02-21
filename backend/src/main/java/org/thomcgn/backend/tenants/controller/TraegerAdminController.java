package org.thomcgn.backend.tenants.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.tenants.dto.CreateTraegerRequest;
import org.thomcgn.backend.tenants.dto.TraegerResponse;
import org.thomcgn.backend.tenants.service.TraegerService;

@RestController
@RequestMapping("/admin/traeger")
public class TraegerAdminController {

    private final TraegerService service;

    public TraegerAdminController(TraegerService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TraegerResponse> create(@Valid @RequestBody CreateTraegerRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TraegerResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }
}