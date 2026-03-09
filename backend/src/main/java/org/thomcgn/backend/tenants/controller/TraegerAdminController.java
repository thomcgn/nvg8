package org.thomcgn.backend.tenants.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.tenants.dto.CreateTraegerRequest;
import org.thomcgn.backend.tenants.dto.TraegerResponse;
import org.thomcgn.backend.tenants.service.TraegerService;

import java.util.List;

@RestController
@RequestMapping("/admin/traeger")
public class TraegerAdminController {

    private final TraegerService service;

    public TraegerAdminController(TraegerService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TraegerResponse>> list() {
        return ResponseEntity.ok(service.list());
    }

    @PostMapping
    public ResponseEntity<TraegerResponse> create(@Valid @RequestBody CreateTraegerRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @GetMapping("/current")
    public ResponseEntity<TraegerResponse> current() {
        return ResponseEntity.ok(service.getCurrent());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TraegerResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(service.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TraegerResponse> update(@PathVariable Long id,
                                                   @Valid @RequestBody CreateTraegerRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }
}
