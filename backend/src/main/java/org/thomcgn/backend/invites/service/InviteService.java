package org.thomcgn.backend.invites.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AdminGuard;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.invites.dto.*;
import org.thomcgn.backend.invites.model.Invite;
import org.thomcgn.backend.invites.repo.InviteRepository;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InviteService {

    private final InviteRepository inviteRepository;
    private final UserRepository userRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AdminGuard adminGuard;

    // Für MVP: base URL hardcodiert oder aus config
    private final String frontendBaseUrl = "https://your-frontend.example.com";

    public InviteService(
            InviteRepository inviteRepository,
            UserRepository userRepository,
            UserOrgRoleRepository userOrgRoleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AdminGuard adminGuard
    ) {
        this.inviteRepository = inviteRepository;
        this.userRepository = userRepository;
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.adminGuard = adminGuard;
    }

    @Transactional
    public CreateInviteResponse createInvite(CreateInviteRequest req) {
        // ctx ist global enforced → wir haben traegerId
        Long currentUserId = SecurityUtils.currentUserId();

        // permission: darf in dieser orgUnit managen?
        OrgUnit target = adminGuard.requireCanManageOrgUnit(req.orgUnitId());

        int hours = (req.expiresInHours() == null) ? 72 : req.expiresInHours();
        if (hours < 1 || hours > 24 * 14) { // max 14 Tage
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "expiresInHours must be between 1 and 336.");
        }

        Set<Role> roles = req.roles().stream().map(r -> {
            try { return Role.valueOf(r); }
            catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown role: " + r); }
        }).collect(Collectors.toSet());

        if (roles.isEmpty()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "At least one role is required.");
        }

        String token = InviteTokenUtil.newToken();
        String hash = InviteTokenUtil.sha256Hex(token);

        Invite inv = new Invite();
        inv.setEmail(req.email().trim().toLowerCase());
        inv.setTokenHashHex(hash);
        inv.setTraeger(target.getTraeger());
        inv.setOrgUnit(target);
        inv.setRoles(roles);
        inv.setExpiresAt(Instant.now().plus(hours, ChronoUnit.HOURS));

        User creator = userRepository.findById(currentUserId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "Creator user not found"));
        inv.setCreatedBy(creator);

        Invite saved = inviteRepository.save(inv);

        String inviteUrl = frontendBaseUrl + "/accept-invite?token=" + token;

        return new CreateInviteResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getTraeger().getId(),
                saved.getOrgUnit().getId(),
                saved.getRoles().stream().map(Enum::name).collect(Collectors.toSet()),
                saved.getExpiresAt(),
                inviteUrl,
                token // in Prod weglassen (oder per config nur in dev zurückgeben)
        );
    }

    @Transactional
    public AcceptInviteResponse acceptInvite(AcceptInviteRequest req) {
        String token = req.token().trim();
        String hash = InviteTokenUtil.sha256Hex(token);

        Invite inv = inviteRepository.findByTokenHash(hash)
                .orElseThrow(() -> DomainException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Invite token invalid."));

        if (inv.isRevoked()) {
            throw DomainException.forbidden(ErrorCode.CONFLICT, "Invite is revoked.");
        }
        if (inv.getUsedAt() != null) {
            throw DomainException.forbidden(ErrorCode.CONFLICT, "Invite already used.");
        }
        if (Instant.now().isAfter(inv.getExpiresAt())) {
            throw DomainException.forbidden(ErrorCode.CONFLICT, "Invite expired.");
        }

        // User upsert by email
        User user = userRepository.findByEmailIgnoreCase(inv.getEmail())
                .orElseGet(() -> {
                    User u = new User();
                    u.setEmail(inv.getEmail());
                    u.setEnabled(true);
                    return u;
                });

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        if (req.vorname() != null) user.setVorname(req.vorname());
        if (req.nachname() != null) user.setNachname(req.nachname());

        // Defaults (UX)
        user.setDefaultTraeger(inv.getTraeger());
        user.setDefaultOrgUnit(inv.getOrgUnit());

        user = userRepository.save(user);

        // Rollen zuweisen (upsert enabled)
        for (Role r : inv.getRoles()) {
            Role role = r;

            User finalUser = user;
            userOrgRoleRepository.findByUserIdAndOrgUnitIdAndRole(user.getId(), inv.getOrgUnit().getId(), role)
                    .map(existing -> {
                        existing.setEnabled(true);
                        return existing;
                    })
                    .orElseGet(() -> {
                        UserOrgRole uor = new UserOrgRole();
                        uor.setUser(finalUser);
                        uor.setOrgUnit(inv.getOrgUnit());
                        uor.setRole(role);
                        uor.setEnabled(true);
                        return userOrgRoleRepository.save(uor);
                    });
        }

        // Invite abschließen
        inv.setUsedAt(Instant.now());
        inv.setAcceptedBy(user);

        // Tokens ausgeben: base + ctx (direkt eingeloggt im Kontext der Einladung)
        String baseToken = jwtService.issueBaseToken(user.getId(), user.getEmail());
        List<String> roles = inv.getRoles().stream().map(Enum::name).toList();
        String accessToken = jwtService.issueContextToken(
                user.getId(),
                inv.getTraeger().getId(),
                inv.getOrgUnit().getId(),
                roles,
                user.getEmail()
        );

        return new AcceptInviteResponse(
                baseToken,
                accessToken,
                user.getId(),
                inv.getTraeger().getId(),
                inv.getOrgUnit().getId(),
                roles
        );
    }

    @Transactional
    public void revokeInvite(Long inviteId) {
        // nur Admins im ctx
        Invite inv = inviteRepository.findByIdAndRevokedFalse(inviteId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Invite not found"));

        adminGuard.requireCanManageOrgUnit(inv.getOrgUnit().getId());
        inv.setRevoked(true);
    }
}