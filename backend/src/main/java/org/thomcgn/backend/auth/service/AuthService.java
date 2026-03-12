package org.thomcgn.backend.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.AvailableContextDto;
import org.thomcgn.backend.auth.dto.LoginRequest;
import org.thomcgn.backend.auth.dto.LoginResponse;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            UserOrgRoleRepository userOrgRoleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse login(LoginRequest req) {
        User user = userRepository.findByEmailIgnoreCase(req.email())
                .filter(User::isEnabled)
                .orElseThrow(() -> DomainException.unauthorized(
                        ErrorCode.AUTH_INVALID_CREDENTIALS,
                        "Invalid email or password"
                ));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw DomainException.unauthorized(
                    ErrorCode.AUTH_INVALID_CREDENTIALS,
                    "Invalid email or password"
            );
        }

        String baseToken = jwtService.issueBaseToken(user.getId(), user.getEmail());

        if (user.isSystemAdmin()) {
            String systemToken = jwtService.issueSystemToken(user.getId(), user.getEmail());
            return new LoginResponse(baseToken, List.of(), true, systemToken);
        }

        List<UserOrgRole> orgRoles = userOrgRoleRepository.findAllActiveByUserId(user.getId());
        List<AvailableContextDto> contexts = buildEinrichtungContexts(orgRoles);
        return new LoginResponse(baseToken, contexts, false, null);
    }

    private List<AvailableContextDto> buildEinrichtungContexts(List<UserOrgRole> roles) {
        // Deduplizieren per (traegerId, einrichtungId)
        Map<Long, AvailableContextDto> seen = new LinkedHashMap<>();
        for (UserOrgRole uor : roles) {
            OrgUnit ou = uor.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;
            if (ou.getTraeger() == null || !ou.getTraeger().isEnabled()) continue;

            OrgUnit einr = findEinrichtungAncestor(ou);
            if (einr == null) continue;

            seen.putIfAbsent(einr.getId(), new AvailableContextDto(
                    einr.getTraeger().getId(),
                    einr.getTraeger().getName(),
                    einr.getId(),
                    einr.getType().name(),
                    einr.getName()
            ));
        }
        return List.copyOf(seen.values());
    }

    private OrgUnit findEinrichtungAncestor(OrgUnit start) {
        OrgUnit current = start;
        int guard = 0;
        while (current != null && guard++ < 50) {
            if (current.getType() == OrgUnitType.EINRICHTUNG) return current;
            current = current.getParent();
        }
        return null;
    }
}