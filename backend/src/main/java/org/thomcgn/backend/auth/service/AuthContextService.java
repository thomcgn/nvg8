package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitMembership;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.orgunits.repo.OrgUnitMembershipRepository;

import java.util.*;

@Service
public class AuthContextService {

    private final OrgUnitMembershipRepository membershipRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final JwtService jwtService;

    public AuthContextService(
            OrgUnitMembershipRepository membershipRepository,
            OrgUnitRepository orgUnitRepository,
            JwtService jwtService
    ) {
        this.membershipRepository = membershipRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public AuthContextOverviewResponse getContextOverview() {
        ActiveAuthContextResponse active = new ActiveAuthContextResponse(
                SecurityUtils.currentTraegerIdOptional(),
                SecurityUtils.currentOrgUnitIdOptional(),
                new HashSet<>(SecurityUtils.currentRolesOptional())
        );
        return new AuthContextOverviewResponse(active, listContexts());
    }

    @Transactional(readOnly = true)
    public List<AuthContextResponse> listContexts() {
        Long userId = SecurityUtils.currentUserId();

        List<OrgUnitMembership> memberships = membershipRepository.findAllActiveRolesByUserId(userId);

        Map<CtxKey, CtxAgg> agg = new LinkedHashMap<>();

        for (OrgUnitMembership m : memberships) {
            OrgUnit ou = m.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;
            if (ou.getTraeger() == null || !ou.getTraeger().isEnabled()) continue;

            OrgUnit einr = findEinrichtungAncestor(ou);
            if (einr == null) continue;
            if (!einr.isEnabled()) continue;
            if (einr.getTraeger() == null || !einr.getTraeger().isEnabled()) continue;

            Long traegerId = einr.getTraeger().getId();
            Long einrichtungId = einr.getId();

            CtxKey key = new CtxKey(traegerId, einrichtungId);
            CtxAgg a = agg.computeIfAbsent(key, k ->
                    new CtxAgg(traegerId, einr.getTraeger().getName(), einrichtungId, einr.getName())
            );
            a.roles.add(m.getRole());
        }

        List<AuthContextResponse> out = new ArrayList<>(agg.size());
        for (CtxAgg a : agg.values()) {
            out.add(new AuthContextResponse(
                    a.traegerId,
                    a.traegerName,
                    a.einrichtungOrgUnitId,
                    a.einrichtungName,
                    Collections.unmodifiableSet(a.roles)
            ));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public SwitchContextResponse switchContext(SwitchContextRequest req) {
        Long userId = SecurityUtils.currentUserId();

        OrgUnit einr = orgUnitRepository.findById(req.einrichtungOrgUnitId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Einrichtung not found"));

        if (einr.getType() != OrgUnitType.EINRICHTUNG) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "orgUnitId must be EINRICHTUNG");
        }
        if (!einr.isEnabled()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Einrichtung disabled.");
        }
        if (einr.getTraeger() == null || !einr.getTraeger().isEnabled()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Traeger disabled.");
        }

        Long targetTraegerId = einr.getTraeger().getId();
        Long targetEinrichtungId = einr.getId();

        List<OrgUnitMembership> memberships = membershipRepository.findAllActiveRolesByUserId(userId);
        Set<String> ctxRoles = new HashSet<>();

        for (OrgUnitMembership m : memberships) {
            OrgUnit ou = m.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;
            if (ou.getTraeger() == null || !ou.getTraeger().isEnabled()) continue;
            if (!ou.getTraeger().getId().equals(targetTraegerId)) continue;

            if (ou.getType() == OrgUnitType.TRAEGER) {
                ctxRoles.add(m.getRole());
                continue;
            }

            OrgUnit ancestor = findEinrichtungAncestor(ou);
            if (ancestor == null) continue;
            if (ancestor.getId().equals(targetEinrichtungId)) {
                ctxRoles.add(m.getRole());
            }
        }

        if (ctxRoles.isEmpty()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Context not allowed for user.");
        }

        String token = jwtService.issueContextToken(
                userId,
                targetTraegerId,
                targetEinrichtungId,
                ctxRoles.stream().sorted().toList(),
                SecurityUtils.currentEmail()
        );

        return new SwitchContextResponse(token);
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

    private record CtxKey(Long traegerId, Long einrichtungOrgUnitId) {}

    private static final class CtxAgg {
        final Long traegerId;
        final String traegerName;
        final Long einrichtungOrgUnitId;
        final String einrichtungName;
        final Set<String> roles = new HashSet<>();

        private CtxAgg(Long traegerId, String traegerName, Long einrichtungOrgUnitId, String einrichtungName) {
            this.traegerId = traegerId;
            this.traegerName = traegerName;
            this.einrichtungOrgUnitId = einrichtungOrgUnitId;
            this.einrichtungName = einrichtungName;
        }
    }
}
