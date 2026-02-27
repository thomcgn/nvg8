package org.thomcgn.backend.falloeffnungen.risk.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.falloeffnungen.risk.dto.RiskEvaluateRequest;
import org.thomcgn.backend.falloeffnungen.risk.dto.RiskSnapshotResponse;
import org.thomcgn.backend.falloeffnungen.risk.service.FallRiskService;

import java.util.List;

@RestController
@RequestMapping("/falloeffnungen/{id}/risk")
public class FallRiskController {

    private final FallRiskService service;

    public FallRiskController(FallRiskService service) {
        this.service = service;
    }

    @PostMapping("/evaluate")
    public ResponseEntity<RiskSnapshotResponse> evaluate(@PathVariable Long id, @Valid @RequestBody RiskEvaluateRequest req) {
        // mode currently only RECOMPUTE_FROM_TAGS
        return ResponseEntity.ok(service.recomputeAndSnapshot(id));
    }

    @GetMapping("/latest")
    public ResponseEntity<RiskSnapshotResponse> latest(@PathVariable Long id) {
        return ResponseEntity.ok(service.latest(id));
    }

    @GetMapping("/history")
    public ResponseEntity<List<RiskSnapshotResponse>> history(@PathVariable Long id) {
        return ResponseEntity.ok(service.history(id));
    }
}