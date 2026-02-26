package org.thomcgn.backend.people.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.people.dto.BezugspersonResponse;    // <- muss existieren
import org.thomcgn.backend.people.dto.CreateBezugspersonRequest;
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
        return ResponseEntity.ok(service.create(req));
    }
}