package org.thomcgn.backend.falloeffnungen.risk.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.falloeffnungen.risk.dto.TraegerRiskMatrixConfigRequest;
import org.thomcgn.backend.falloeffnungen.risk.dto.TraegerRiskMatrixConfigResponse;
import org.thomcgn.backend.falloeffnungen.risk.service.TraegerRiskMatrixConfigService;

import java.util.List;

@RestController
@RequestMapping("/traeger/risk-matrix-config")
public class TraegerRiskMatrixConfigController {

    private final TraegerRiskMatrixConfigService service;

    public TraegerRiskMatrixConfigController(TraegerRiskMatrixConfigService service) {
        this.service = service;
    }

    @GetMapping("/active")
    public ResponseEntity<TraegerRiskMatrixConfigResponse> active() {
        return ResponseEntity.ok(service.getActive());
    }

    @GetMapping("/history")
    public ResponseEntity<List<TraegerRiskMatrixConfigResponse>> history() {
        return ResponseEntity.ok(service.history());
    }

    @PostMapping
    public ResponseEntity<TraegerRiskMatrixConfigResponse> create(@Valid @RequestBody TraegerRiskMatrixConfigRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PostMapping("/{configId}/activate")
    public ResponseEntity<TraegerRiskMatrixConfigResponse> activate(@PathVariable Long configId) {
        return ResponseEntity.ok(service.activate(configId));
    }
}