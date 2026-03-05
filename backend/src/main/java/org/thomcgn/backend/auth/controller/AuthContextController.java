package org.thomcgn.backend.auth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.dto.SelectContextRequest;
import org.thomcgn.backend.auth.dto.SelectContextResponse;
import org.thomcgn.backend.auth.dto.SwitchContextRequest;
import org.thomcgn.backend.auth.dto.SwitchContextResponse;
import org.thomcgn.backend.auth.model.AuthCookies;
import org.thomcgn.backend.auth.service.ContextService;
import org.thomcgn.backend.common.security.JwtProperties;
import org.thomcgn.backend.common.security.SecurityUtils;

@RestController
@RequestMapping("/auth/context")
public class AuthContextController {

    private final ContextService contextService;
    private final JwtProperties jwtProperties;
    private final boolean cookieSecure;

    public AuthContextController(
            ContextService contextService,
            JwtProperties jwtProperties,
            @Value("${kidoc.cookies.secure:true}") boolean cookieSecure
    ) {
        this.contextService = contextService;
        this.jwtProperties = jwtProperties;
        this.cookieSecure = cookieSecure;
    }

    /**
     * Dein Frontend ruft aktuell POST /auth/context/switch mit SwitchContextRequest auf.
     * Intern mappen wir auf ContextService.selectContext(...)
     * und setzen den Context/Access Token als HttpOnly Cookie (kidoc_access).
     */
    @PostMapping("/switch")
    public ResponseEntity<?> switchContext(@RequestBody SwitchContextRequest req) {

        Long userId = SecurityUtils.currentUserId(); // aus Base Token

        // ✅ Wir bauen daraus den Request-Typ, den dein Service erwartet
        SelectContextRequest mapped = new SelectContextRequest(req.einrichtungOrgUnitId());

        SelectContextResponse res = contextService.selectContext(userId, mapped);

        long accessMaxAge = jwtProperties.getAccessTtlMinutes() * 60L;

        // ✅ Cookie setzen
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE,
                        AuthCookies.accessCookie(res.accessToken(), accessMaxAge, cookieSecure).toString()
                )
                // Body kompatibel lassen: du bekommst weiterhin "token" zurück, falls dein FE das liest
                .body(new SwitchContextResponse(res.accessToken()));
    }
}