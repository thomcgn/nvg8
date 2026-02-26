package org.thomcgn.backend.auth.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.model.AuthCookies;
import org.thomcgn.backend.auth.dto.AuthContextOverviewResponse;
import org.thomcgn.backend.auth.dto.SwitchContextRequest;
import org.thomcgn.backend.auth.dto.SwitchContextResponse;
import org.thomcgn.backend.auth.service.AuthContextService;
import org.thomcgn.backend.common.security.JwtProperties;

@RestController
@RequestMapping("/auth")
public class AuthContextController {

    private final AuthContextService ctx;
    private final JwtProperties jwtProperties;

    private final boolean cookieSecure = false;

    public AuthContextController(AuthContextService ctx, JwtProperties jwtProperties) {
        this.ctx = ctx;
        this.jwtProperties = jwtProperties;
    }

    @GetMapping("/context")
    public ResponseEntity<AuthContextOverviewResponse> context() {
        return ResponseEntity.ok(ctx.getContextOverview());
    }

    @PostMapping("/context/switch")
    public ResponseEntity<SwitchContextResponse> switchContext(@Valid @RequestBody SwitchContextRequest req) {
        SwitchContextResponse res = ctx.switchContext(req);

        long accessMaxAge = jwtProperties.getAccessTtlMinutes() * 60L;

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessCookie(res.token(), accessMaxAge, cookieSecure).toString())
                .body(res);
    }
}