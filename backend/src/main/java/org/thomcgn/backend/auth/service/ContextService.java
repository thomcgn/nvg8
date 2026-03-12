package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.SelectContextRequest;
import org.thomcgn.backend.auth.dto.SelectContextResponse;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitMembershipRepository;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class ContextService {

    private final OrgUnitMembershipRepository membershipRepository;
    private final JwtService jwtService;

    public ContextService(OrgUnitMembershipRepository membershipRepository, JwtService jwtService) {
        this.membershipRepository = membershipRepository;
        this.jwtService = jwtService;
    }

    public SelectContextResponse selectContext(Long userId, SelectContextRequest req) {
        List<OrgUnitMembership> allRoles = membershipRepository.findAllActiveRolesByUserId(userId);

        // Direkte Rolle auf der gewählten Einrichtung muss existieren
        boolean hasDirectAccess = allRoles.stream()
                .anyMatch(m -> m.getOrgUnit().getId().equals(req.orgUnitId()));
        if (!hasDirectAccess) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No access to selected context");
        }

        Long traegerId = allRoles.stream()
                .filter(m -> m.getOrgUnit().getId().equals(req.orgUnitId()))
                .findFirst()
                .map(m -> m.getOrgUnit().getTraeger().getId())
                .orElseThrow();

        // Rollen aggregieren: direkte Rollen auf Einrichtung + TRAEGER-Rollen desselben Trägers
        Set<String> roles = new LinkedHashSet<>();
        for (OrgUnitMembership m : allRoles) {
            Long mTraegerId = m.getOrgUnit().getTraeger().getId();
            if (!mTraegerId.equals(traegerId)) continue;

            if (m.getOrgUnit().getId().equals(req.orgUnitId())) {
                roles.add(m.getRole());
            } else if (m.getOrgUnit().getType() == OrgUnitType.TRAEGER) {
                roles.add(m.getRole());
            }
        }

        String email = SecurityUtils.currentEmail();
        String accessToken = jwtService.issueContextToken(userId, traegerId, req.orgUnitId(), List.copyOf(roles), email);
        return new SelectContextResponse(accessToken);
    }
}
