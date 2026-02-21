package org.thomcgn.backend.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.ContextsResponse;
import org.thomcgn.backend.auth.dto.MeResponse;
import org.thomcgn.backend.auth.service.AuthQueryService;

@RestController
@RequestMapping("/auth")
public class AuthQueryController {

    private final AuthQueryService authQueryService;

    public AuthQueryController(AuthQueryService authQueryService) {
        this.authQueryService = authQueryService;
    }

    // works with base token AND ctx token
    @GetMapping("/me")
    public ResponseEntity<MeResponse> me() {
        return ResponseEntity.ok(authQueryService.me());
    }

    // works with base token AND ctx token
    @GetMapping("/contexts")
    public ResponseEntity<ContextsResponse> contexts() {
        return ResponseEntity.ok(authQueryService.contexts());
    }
}