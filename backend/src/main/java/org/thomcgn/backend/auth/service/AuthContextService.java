package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.dto.*;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.*;

@Service
public class AuthContextService {

    private final UserRepository userRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final JwtService jwtService;

    public AuthContextService(UserRepository userRepository,
                              OrgUnitRepository orgUnitRepository,
                              JwtService jwtService) {
        this.userRepository = userRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.jwtService = jwtService;
    }

    /**
     * NEW: Liefert aktiven Kontext (aus JWT) + alle auswählbaren Kontexte (Traeger + EINRICHTUNG) aus DB.
     */
    @Transactional(readOnly = true)
    public AuthContextOverviewResponse getContextOverview() {
        ActiveAuthContextResponse active = new ActiveAuthContextResponse(
                SecurityUtils.currentTraegerIdOptional(),
                SecurityUtils.currentOrgUnitIdOptional(),
                new HashSet<>(SecurityUtils.currentRolesOptional())
        );

        return new AuthContextOverviewResponse(active, listContexts());
    }

    /**
     * Liefert alle auswählbaren Kontexte (Traeger + EINRICHTUNG) für den eingeloggten User.
     * Ein User kann Rollen in mehreren Teams/Ebenen haben -> wir aggregieren immer auf EINRICHTUNG.
     */
    @Transactional(readOnly = true)
    public List<AuthContextResponse> listContexts() {
        Long userId = SecurityUtils.currentUserId();

        User user = userRepository.findByIdWithOrgRoles(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        // Aggregation: (traegerId, einrichtungId) -> roles + names
        Map<CtxKey, CtxAgg> agg = new LinkedHashMap<>();

        for (UserOrgRole uor : user.getOrgRoles()) {
            if (!uor.isEnabled()) continue;

            OrgUnit ou = uor.getOrgUnit();
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

            a.roles.add(uor.getRole().name());
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

    /**
     * Switch Context: validiert, dass User im gewünschten EINRICHTUNG-Kontext Rollen hat,
     * und mintet ctx-JWT mit tid+oid+roles.
     *
     * Wichtig:
     * - TraegerId wird serverseitig aus der EINRICHTUNG (OrgUnit) abgeleitet.
     * - Rollen werden serverseitig aus UserOrgRole aggregiert.
     */
    @Transactional(readOnly = true)
    public SwitchContextResponse switchContext(SwitchContextRequest req) {
        Long userId = SecurityUtils.currentUserId();

        User user = userRepository.findByIdWithOrgRoles(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

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

        // Rollen aggregieren: alle Rollen des Users irgendwo unter dieser EINRICHTUNG zählen in den Kontext
        Set<String> ctxRoles = new HashSet<>();

        for (UserOrgRole uor : user.getOrgRoles()) {
            if (!uor.isEnabled()) continue;

            OrgUnit ou = uor.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;
            if (ou.getTraeger() == null || !ou.getTraeger().isEnabled()) continue;

            // schneller Filter: gleicher Träger
            if (!ou.getTraeger().getId().equals(targetTraegerId)) continue;

            OrgUnit ancestor = findEinrichtungAncestor(ou);
            if (ancestor == null) continue;

            if (ancestor.getId().equals(targetEinrichtungId)) {
                ctxRoles.add(uor.getRole().name());
            }
        }

        if (ctxRoles.isEmpty()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Context not allowed for user.");
        }

        String token = jwtService.issueContextToken(
                user.getId(),
                targetTraegerId,
                targetEinrichtungId,
                ctxRoles.stream().sorted().toList(),
                user.getEmail()
        );

        return new SwitchContextResponse(token);
    }

    // ---------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------

    /**
     * Steigt im OrgUnit-Baum hoch bis EINRICHTUNG.
     * Hinweis: parent ist LAZY; Zugriff kann zusätzliche Loads verursachen, ist aber ok für Context-Calls.
     */
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