package org.thomcgn.backend.auth.service;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.Collections;
import java.util.List;

@Service
public class AuthQueryService {

    private final UserRepository userRepository;
    private final UserOrgRoleRepository userOrgRoleRepository;

    public AuthQueryService(UserRepository userRepository, UserOrgRoleRepository userOrgRoleRepository) {
        this.userRepository = userRepository;
        this.userOrgRoleRepository = userOrgRoleRepository;
    }

    public MeResponse me() {
        var principal = SecurityUtils.principal();

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        boolean ctx = principal.isContext();

        Long tid = null;
        Long oid = null;
        List<String> roles = Collections.emptyList();

        if (ctx) {
            tid = principal.getTraegerId();
            oid = principal.getOrgUnitId();

            // Rollen aus Token sind die Source-of-truth für Requests
            Claims c = principal.getClaims();
            Object rolesObj = c.get(JwtService.CLAIM_ROLES);
            if (rolesObj instanceof List<?> list) {
                roles = list.stream().map(Object::toString).toList();
            }
        }

        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                ctx,
                tid,
                oid,
                roles
        );
    }

    public ContextsResponse contexts() {
        Long userId = SecurityUtils.currentUserId();

        List<AvailableContextDto> contexts = userOrgRoleRepository.findDistinctActiveOrgUnitsForUser(userId)
                .stream()
                .map(this::toDto)
                .toList();

        return new ContextsResponse(contexts);
    }

    private AvailableContextDto toDto(OrgUnit ou) {
        return new AvailableContextDto(
                ou.getTraeger().getId(),
                ou.getId(),
                ou.getType().name(),
                ou.getName()
        );
    }
}