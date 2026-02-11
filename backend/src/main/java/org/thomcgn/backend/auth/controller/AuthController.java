package org.thomcgn.backend.auth.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.dto.LoginRequest;
import org.thomcgn.backend.auth.dto.LoginResponse;
import org.thomcgn.backend.auth.dto.UserInfoResponse;
import org.thomcgn.backend.auth.repositories.UserRepository;
import org.thomcgn.backend.auth.service.JwtService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    // DEV-Flag aus application.properties oder ENV
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

        // Cookie richtig setzen je nach DEV/PROD
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
                null, // Token im Body nicht nötig
                user.getVorname() + " " + user.getNachname(),
                user.getRole().name(),
                previousLogin
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me(
            @AuthenticationPrincipal UserDetails principal
    ) {

        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        var user = userRepository.findByEmail(principal.getUsername())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        return ResponseEntity.ok(new UserInfoResponse(
                user.getVorname() + " " + user.getNachname(),
                user.getRole().name(),
                user.getLastLogin()
        ));
    }

}
