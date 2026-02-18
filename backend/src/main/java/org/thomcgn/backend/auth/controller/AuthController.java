package org.thomcgn.backend.auth.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.auth.dto.LoginRequest;
import org.thomcgn.backend.auth.dto.LoginResponse;
import org.thomcgn.backend.auth.dto.UserInfoResponse;
import org.thomcgn.backend.auth.repositories.UserRepository;
import org.thomcgn.backend.auth.service.JwtService;
import org.thomcgn.backend.dto.ProfileUpdateRequest;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${app.devMode:true}")
    private boolean devMode;

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ungültige Zugangsdaten"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Ungültige Zugangsdaten");
        }

        LocalDateTime previousLogin = user.getLastLogin();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String token = jwtService.generateToken(user, previousLogin);

        String sameSite = devMode ? "Lax" : "None";
        String secure = devMode ? "" : "Secure; ";
        String cookieValue = String.format(
                "token=%s; HttpOnly; %sPath=/; Max-Age=%d; SameSite=%s",
                token,
                secure,
                60 * 60,
                sameSite
        );

        response.setHeader("Set-Cookie", cookieValue);

        return ResponseEntity.ok(new LoginResponse(
                null,
                user.getVorname() + " " + user.getNachname(),
                user.getRole().name(),
                previousLogin
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me(@AuthenticationPrincipal AuthPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        LocalDateTime lastLogin =
                user.lastLoginEpochMillis() == null
                        ? null
                        : LocalDateTime.ofInstant(Instant.ofEpochMilli(user.lastLoginEpochMillis()), ZoneId.systemDefault());

        return ResponseEntity.ok(new UserInfoResponse(
                user.name(),
                user.role().name(),
                lastLogin
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {

        String sameSite = devMode ? "Lax" : "None";
        String secure = devMode ? "" : "Secure; ";

        String cookieValue = String.format(
                "token=; HttpOnly; %sPath=/; Max-Age=0; SameSite=%s",
                secure,
                sameSite
        );

        response.setHeader("Set-Cookie", cookieValue);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@AuthenticationPrincipal AuthPrincipal user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        return userRepository.findByEmail(user.email())
                .<ResponseEntity<?>>map(u -> ResponseEntity.ok(
                        new org.thomcgn.backend.dto.ProfileResponse(
                                u.getVorname(),
                                u.getNachname(),
                                u.getEmail(),
                                u.getTelefon()
                        )
                ))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found")));
    }
    @PatchMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal AuthPrincipal principal,
            @RequestBody ProfileUpdateRequest request
    ) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Not authenticated"));
        }

        return userRepository.findByEmail(principal.email())
                .<ResponseEntity<?>>map(user -> {

                    user.setVorname(request.vorname());
                    user.setNachname(request.nachname());
                    user.setTelefon(request.telefon());

                    // ⚠️ Empfehlung: Email NICHT hier ändern, wenn Email Login-Identifier ist
                    // user.setEmail(request.email());

                    userRepository.save(user);

                    return ResponseEntity.ok(
                            Map.of("status", "ok")
                    );
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "User not found")));
    }
}