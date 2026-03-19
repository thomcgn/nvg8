package org.thomcgn.backend.auth.service;

import io.jsonwebtoken.Claims;
import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitMembershipRepository;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AuthQueryService {

    private final UserRepository userRepository;
    private final OrgUnitMembershipRepository membershipRepository;
    private final OrgUnitRepository orgUnitRepository;

    public AuthQueryService(UserRepository userRepository, OrgUnitMembershipRepository membershipRepository, OrgUnitRepository orgUnitRepository) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.orgUnitRepository = orgUnitRepository;
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

        List<OrgUnitMembership> memberships = membershipRepository.findAllActiveRolesByUserId(userId);
        Map<Long, AvailableContextDto> seen = new LinkedHashMap<>();

        for (OrgUnitMembership m : memberships) {
            OrgUnit ou = m.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;
            if (ou.getTraeger() == null || !ou.getTraeger().isEnabled()) continue;

            // TRAEGER-level roles grant access to all Einrichtungen under that Träger
            if (ou.getType() == OrgUnitType.TRAEGER) {
                orgUnitRepository.findAllEnabledByTraegerId(ou.getTraeger().getId()).stream()
                        .filter(e -> e.getType() == OrgUnitType.EINRICHTUNG)
                        .forEach(einr -> seen.putIfAbsent(einr.getId(), toDto(einr)));
                continue;
            }

            OrgUnit einr = findEinrichtungAncestor(ou);
            if (einr == null) continue;
            seen.putIfAbsent(einr.getId(), toDto(einr));
        }

        return new ContextsResponse(List.copyOf(seen.values()));
    }

    private AvailableContextDto toDto(OrgUnit einr) {
        return new AvailableContextDto(
                einr.getTraeger().getId(),
                einr.getTraeger().getName(),
                einr.getId(),
                einr.getType().name(),
                einr.getName()
        );
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