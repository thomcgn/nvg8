package org.thomcgn.backend.tenants.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.tenants.dto.*;
import org.thomcgn.backend.tenants.service.TraegerRiskIndicatorService;

import java.util.List;

@RestController
@RequestMapping("/admin/traeger/{traegerId}/risk-indicators")
public class TraegerRiskIndicatorAdminController {

    private final TraegerRiskIndicatorService service;

    public TraegerRiskIndicatorAdminController(TraegerRiskIndicatorService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TraegerRiskIndicatorResponse>> list(@PathVariable Long traegerId) {
        return ResponseEntity.ok(service.adminList(traegerId));
    }

    @PostMapping
    public ResponseEntity<TraegerRiskIndicatorResponse> create(
            @PathVariable Long traegerId,
            @Valid @RequestBody CreateTraegerRiskIndicatorRequest req
    ) {
        return ResponseEntity.ok(service.adminCreate(traegerId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TraegerRiskIndicatorResponse> update(
            @PathVariable Long traegerId,
            @PathVariable Long id,
            @Valid @RequestBody UpdateTraegerRiskIndicatorRequest req
    ) {
        return ResponseEntity.ok(service.adminUpdate(traegerId, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long traegerId,
            @PathVariable Long id
    ) {
        service.adminDelete(traegerId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/reorder")
    public ResponseEntity<List<TraegerRiskIndicatorResponse>> reorder(
            @PathVariable Long traegerId,
            @Valid @RequestBody ReorderTraegerRiskIndicatorsRequest req
    ) {
        return ResponseEntity.ok(service.adminReorder(traegerId, req));
    }
}