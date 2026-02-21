package org.thomcgn.backend.auth.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.auth.service.AuthContextService;

import java.util.List;

@RestController
@RequestMapping("/auth")
public class AuthContextController {

    private final AuthContextService ctx;

    public AuthContextController(AuthContextService ctx) {
        this.ctx = ctx;
    }

    @GetMapping("/contexts")
    public ResponseEntity<List<AuthContextResponse>> contexts() {
        return ResponseEntity.ok(ctx.listContexts());
    }

    @PostMapping("/switch-context")
    public ResponseEntity<SwitchContextResponse> switchContext(@Valid @RequestBody SwitchContextRequest req) {
        return ResponseEntity.ok(ctx.switchContext(req));
    }
}