package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.SelectContextRequest;
import org.thomcgn.backend.auth.dto.SelectContextResponse;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserOrgRoleRepository;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class ContextService {

    private final UserOrgRoleRepository userOrgRoleRepository;
    private final JwtService jwtService;

    public ContextService(UserOrgRoleRepository userOrgRoleRepository, JwtService jwtService) {
        this.userOrgRoleRepository = userOrgRoleRepository;
        this.jwtService = jwtService;
    }

    public SelectContextResponse selectContext(Long userId, SelectContextRequest req) {
        List<UserOrgRole> allRoles = userOrgRoleRepository.findAllActiveByUserId(userId);

        // Direkte Rolle auf der gewählten Einrichtung muss existieren
        boolean hasDirectAccess = allRoles.stream()
                .anyMatch(uor -> uor.getOrgUnit().getId().equals(req.orgUnitId()));
        if (!hasDirectAccess) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No access to selected context");
        }

        // TraegerId aus der gewählten Einrichtung
        Long traegerId = allRoles.stream()
                .filter(uor -> uor.getOrgUnit().getId().equals(req.orgUnitId()))
                .findFirst()
                .map(uor -> uor.getOrgUnit().getTraeger().getId())
                .orElseThrow();

        // Rollen aggregieren:
        // 1. Direkte Rollen auf der gewählten Einrichtung
        // 2. Rollen auf dem TRAEGER-Root desselben Trägers (TRAEGER_ADMIN gilt trägerübergreifend)
        Set<String> roles = new LinkedHashSet<>();
        for (UserOrgRole uor : allRoles) {
            Long uorTraegerId = uor.getOrgUnit().getTraeger().getId();
            if (!uorTraegerId.equals(traegerId)) continue;

            if (uor.getOrgUnit().getId().equals(req.orgUnitId())) {
                roles.add(uor.getRole().name());
            } else if (uor.getOrgUnit().getType() == OrgUnitType.TRAEGER) {
                roles.add(uor.getRole().name());
            }
        }

        String email = SecurityUtils.currentEmail();
        String accessToken = jwtService.issueContextToken(userId, traegerId, req.orgUnitId(), List.copyOf(roles), email);
        return new SelectContextResponse(accessToken);
    }
}