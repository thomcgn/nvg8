package org.thomcgn.backend.auth.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.AuthContextOverviewResponse;
import org.thomcgn.backend.auth.dto.SwitchContextRequest;
import org.thomcgn.backend.auth.dto.SwitchContextResponse;
import org.thomcgn.backend.auth.service.AuthContextService;

@RestController
@RequestMapping("/auth")
public class AuthContextController {

    private final AuthContextService ctx;

    public AuthContextController(AuthContextService ctx) {
        this.ctx = ctx;
    }

    /**
     * NEW: Aktiver Kontext (aus JWT) + verfügbare Kontexte (aus DB).
     */
    @GetMapping("/context")
    public ResponseEntity<AuthContextOverviewResponse> context() {
        return ResponseEntity.ok(ctx.getContextOverview());
    }

    /**
     * NEW: Switch EINRICHTUNG-Kontext (Träger wird serverseitig aus OrgUnit abgeleitet).
     */
    @PostMapping("/context/switch")
    public ResponseEntity<SwitchContextResponse> switchContext(@Valid @RequestBody SwitchContextRequest req) {
        return ResponseEntity.ok(ctx.switchContext(req));
    }

}