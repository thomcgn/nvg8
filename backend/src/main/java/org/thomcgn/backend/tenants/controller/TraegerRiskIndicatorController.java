package org.thomcgn.backend.tenants.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.tenants.dto.TraegerRiskIndicatorResponse;
import org.thomcgn.backend.tenants.service.TraegerRiskIndicatorService;

import java.util.List;

@RestController
@RequestMapping("/traeger/me/risk-indicators")
public class TraegerRiskIndicatorController {

    private final TraegerRiskIndicatorService service;

    public TraegerRiskIndicatorController(TraegerRiskIndicatorService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<TraegerRiskIndicatorResponse>> listForMe() {
        return ResponseEntity.ok(service.listForCurrentTraeger());
    }
}