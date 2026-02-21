package org.thomcgn.backend.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.auth.service.AuthService;
import org.thomcgn.backend.auth.service.ContextService;
import org.thomcgn.backend.common.security.SecurityUtils;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final ContextService contextService;

    public AuthController(AuthService authService, ContextService contextService) {
        this.authService = authService;
        this.contextService = contextService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/context")
    public ResponseEntity<SelectContextResponse> selectContext(@RequestBody SelectContextRequest req) {
        Long userId = SecurityUtils.currentUserId(); // aus Base-JWT
        return ResponseEntity.ok(contextService.selectContext(userId, req));
    }
}