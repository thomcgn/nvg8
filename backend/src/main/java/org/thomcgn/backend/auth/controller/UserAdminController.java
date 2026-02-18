package org.thomcgn.backend.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.thomcgn.backend.auth.data.Role;
import org.thomcgn.backend.auth.data.User;
import org.thomcgn.backend.auth.dto.AuthPrincipal;
import org.thomcgn.backend.auth.dto.CreateUserRequest;
import org.thomcgn.backend.auth.dto.UpdateUserRoleRequest;
import org.thomcgn.backend.auth.dto.UserAdminResponse;
import org.thomcgn.backend.auth.repositories.UserRepository;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_TEAMLEITUNG')")
public class UserAdminController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAdminController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<UserAdminResponse> listUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    public ResponseEntity<UserAdminResponse> createUser(
            @RequestBody CreateUserRequest req,
            @AuthenticationPrincipal AuthPrincipal actor
    ) {
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        if (req.email() == null || req.email().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email required");
        }
        if (req.password() == null || req.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password required");
        }
        if (req.role() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role required");
        }

        Role actorRole = actor.role();
        Role targetRole = req.role();

        // ✅ TEAMLEITUNG darf niemals ADMIN erstellen
        if (actorRole == Role.TEAMLEITUNG && targetRole == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TEAMLEITUNG may not create ADMIN");
        }

        // Optional (empfohlen): TEAMLEITUNG darf keine TEAMLEITUNG erstellen
        // (sonst kann eine TEAMLEITUNG beliebig neue Leitungen erzeugen)
        // if (actorRole == Role.TEAMLEITUNG && targetRole == Role.TEAMLEITUNG) {
        //     throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TEAMLEITUNG may not create TEAMLEITUNG");
        // }

        String email = req.email().trim().toLowerCase();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "email already exists");
        }

        User u = new User();
        u.setEmail(email);
        u.setVorname(req.vorname());
        u.setNachname(req.nachname());
        u.setRole(targetRole);
        u.setPasswordHash(passwordEncoder.encode(req.password()));

        userRepository.save(u);

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(u));
    }

    @PatchMapping("/{id}/role")
    public UserAdminResponse updateRole(
            @PathVariable Long id,
            @RequestBody UpdateUserRoleRequest req,
            @AuthenticationPrincipal AuthPrincipal actor
    ) {
        if (req.role() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "role required");
        }
        if (actor == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }

        Role actorRole = actor.role();
        Role targetRole = req.role();

        // ✅ TEAMLEITUNG darf niemals ADMIN vergeben
        if (actorRole == Role.TEAMLEITUNG && targetRole == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "TEAMLEITUNG may not assign ADMIN");
        }

        User u = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "user not found"));

        u.setRole(targetRole);
        userRepository.save(u);

        return toResponse(u);
    }

    private UserAdminResponse toResponse(User u) {
        return new UserAdminResponse(
                u.getId(),
                u.getEmail(),
                u.getVorname(),
                u.getNachname(),
                u.getRole(),
                u.getLastLogin()
        );
    }
}