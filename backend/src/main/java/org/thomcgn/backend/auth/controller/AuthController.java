package org.thomcgn.backend.auth.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.model.AuthCookies;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.auth.service.AuthService;
import org.thomcgn.backend.auth.service.ContextService;
import org.thomcgn.backend.common.security.JwtProperties;
import org.thomcgn.backend.common.security.SecurityUtils;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final ContextService contextService;
    private final JwtProperties jwtProperties;

    // DEV: auf localhost ohne https -> secure=false
    private final boolean cookieSecure = false;

    public AuthController(AuthService authService, ContextService contextService, JwtProperties jwtProperties) {
        this.authService = authService;
        this.contextService = contextService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest req) {
        LoginResponse res = authService.login(req);

        long baseMaxAge = jwtProperties.getBaseTtlMinutes() * 60L;

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.baseCookie(res.baseToken(), baseMaxAge, cookieSecure).toString())
                // optional: access cookie beim login leeren, damit keine "alten" Sessions kleben
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearAccess(cookieSecure).toString())
                .body(res);
    }

    @PostMapping("/context")
    public ResponseEntity<SelectContextResponse> selectContext(@RequestBody SelectContextRequest req) {
        Long userId = SecurityUtils.currentUserId(); // aus Base-JWT (Cookie oder Header)

        SelectContextResponse res = contextService.selectContext(userId, req);

        long accessMaxAge = jwtProperties.getAccessTtlMinutes() * 60L;

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.accessCookie(res.accessToken(), accessMaxAge, cookieSecure).toString())
                .body(res);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearBase(cookieSecure).toString())
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clearAccess(cookieSecure).toString())
                .build();
    }
}