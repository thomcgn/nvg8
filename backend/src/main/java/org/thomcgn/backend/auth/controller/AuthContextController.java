package org.thomcgn.backend.auth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.SwitchContextRequest;
import org.thomcgn.backend.auth.dto.SwitchContextResponse;
import org.thomcgn.backend.auth.model.AuthCookies;
import org.thomcgn.backend.auth.service.AuthContextService;
import org.thomcgn.backend.common.security.JwtProperties;

@RestController
@RequestMapping("/auth/context")
public class AuthContextController {

    private final AuthContextService authContextService;
    private final JwtProperties jwtProperties;
    private final boolean cookieSecure;

    public AuthContextController(
            AuthContextService authContextService,
            JwtProperties jwtProperties,
            @Value("${kidoc.cookies.secure:true}") boolean cookieSecure
    ) {
        this.authContextService = authContextService;
        this.jwtProperties = jwtProperties;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/switch")
    public ResponseEntity<SwitchContextResponse> switchContext(@RequestBody SwitchContextRequest req) {
        SwitchContextResponse res = authContextService.switchContext(req);

        long accessMaxAge = jwtProperties.getAccessTtlMinutes() * 60L;

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        AuthCookies.accessCookie(res.token(), accessMaxAge, cookieSecure).toString())
                .body(res);
    }
}