package org.thomcgn.backend.auth.model;

import org.springframework.http.ResponseCookie;

public final class AuthCookies {

    private AuthCookies() {}

    public static final String BASE_COOKIE = "kidoc_base";
    public static final String ACCESS_COOKIE = "kidoc_access";

    // ✅ cross-origin fetch braucht None (+ Secure)
    private static final String SAME_SITE = "None";

    public static ResponseCookie baseCookie(String token, long maxAgeSeconds, boolean secure) {
        return ResponseCookie.from(BASE_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(SAME_SITE)
                .maxAge(maxAgeSeconds)
                .build();
    }

    public static ResponseCookie accessCookie(String token, long maxAgeSeconds, boolean secure) {
        return ResponseCookie.from(ACCESS_COOKIE, token)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(SAME_SITE)
                .maxAge(maxAgeSeconds)
                .build();
    }

    public static ResponseCookie clearBase(boolean secure) {
        return ResponseCookie.from(BASE_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(SAME_SITE)
                .maxAge(0)
                .build();
    }

    public static ResponseCookie clearAccess(boolean secure) {
        return ResponseCookie.from(ACCESS_COOKIE, "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite(SAME_SITE)
                .maxAge(0)
                .build();
    }
}