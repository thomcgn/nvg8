package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;

import java.util.HashSet;
import java.util.Set;

@Service
public class AccessControlService {

    private final OrgUnitRepository orgUnitRepository;

    public AccessControlService(OrgUnitRepository orgUnitRepository) {
        this.orgUnitRepository = orgUnitRepository;
    }

    // =====================================================
    // ROLE CHECKS (from JWT authorities)
    // =====================================================

    public boolean has(Role role) {
        String required = "ROLE_" + role.name();
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> required.equals(a.getAuthority()));
    }

    public boolean hasAny(Role... roles) {
        for (Role r : roles) if (has(r)) return true;
        return false;
    }

    public void requireAny(Role... roles) {
        if (!hasAny(roles)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Missing required role.");
        }
    }

    // =====================================================
    // TENANT + SCOPE (Traeger + Einrichtung subtree)
    // =====================================================

    /**
     * Core check for business objects: same Traeger + within current scope + roles.
     * ownerEinrichtungOrgUnitId MUST be the Einrichtung (stable owner).
     */
    public void requireAccessToEinrichtungObject(Long objectTraegerId, Long ownerEinrichtungOrgUnitId, Role... requiredRoles) {
        Long currentTraegerId = SecurityUtils.currentTraegerIdRequired();
        if (!currentTraegerId.equals(objectTraegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Cross-traeger access denied.");
        }

        // scope: TRAEGER_ADMIN = all within traeger, else only within own Einrichtung subtree
        if (!isEinrichtungWithinCurrentScope(ownerEinrichtungOrgUnitId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Outside Einrichtung scope.");
        }

        if (requiredRoles != null && requiredRoles.length > 0) {
            requireAny(requiredRoles);
        }
    }

    /**
     * Ensures team is a descendant of the given Einrichtung.
     * (Your domain rule: no Team without Einrichtung.)
     */
    public void requireTeamUnderEinrichtung(Long teamOrgUnitId, Long einrichtungOrgUnitId) {
        if (teamOrgUnitId == null || einrichtungOrgUnitId == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "teamOrgUnitId and einrichtungOrgUnitId are required.");
        }
        if (teamOrgUnitId.equals(einrichtungOrgUnitId)) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "teamOrgUnitId cannot equal einrichtungOrgUnitId.");
        }
        if (!isDescendant(teamOrgUnitId, einrichtungOrgUnitId)) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Team must be within the Einrichtung subtree.");
        }
    }

    /**
     * Returns the Einrichtung root id for the active context org unit.
     * Active context can be EINRICHTUNG or TEAM.
     * Returns null if no Einrichtung ancestor exists (would indicate broken data).
     */
    public Long activeEinrichtungId() {
        Long activeOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();
        return findEinrichtungAncestorId(activeOrgUnitId);
    }

    // =====================================================
    // INTERNALS
    // =====================================================

    private boolean isEinrichtungWithinCurrentScope(Long einrichtungOrgUnitId) {
        // Fast path: TRAEGER_ADMIN sees everything in traeger (still tenant checked above)
        if (has(Role.TRAEGER_ADMIN)) return true;

        Long activeEinrichtungId = activeEinrichtungId();
        if (activeEinrichtungId == null) return false;

        // Einrichtung must match active Einrichtung (stable scope)
        return einrichtungOrgUnitId.equals(activeEinrichtungId);
    }

    private Long findEinrichtungAncestorId(Long startOrgUnitId) {
        Set<Long> visited = new HashSet<>();
        Long currentId = startOrgUnitId;

        while (currentId != null) {
            if (!visited.add(currentId)) {
                throw DomainException.conflict(ErrorCode.CONFLICT, "OrgUnit parent cycle detected.");
            }

            OrgUnit current = orgUnitRepository.findById(currentId).orElse(null);
            if (current == null) return null;

            if (current.getType() == OrgUnitType.EINRICHTUNG) {
                return current.getId();
            }

            // By your domain: Team always has an Einrichtung ancestor, and Einrichtung has a Traeger ancestor.
            if (current.getParent() == null) return null;

            currentId = current.getParent().getId();
        }
        return null;
    }

    /**
     * True if target is a descendant of root (not equal).
     */
    private boolean isDescendant(Long targetId, Long rootId) {
        if (targetId.equals(rootId)) return false;

        Set<Long> visited = new HashSet<>();
        Long currentId = targetId;

        while (currentId != null) {
            if (!visited.add(currentId)) {
                throw DomainException.conflict(ErrorCode.CONFLICT, "OrgUnit parent cycle detected.");
            }

            OrgUnit current = orgUnitRepository.findById(currentId).orElse(null);
            if (current == null) return false;

            OrgUnit parent = current.getParent();
            if (parent == null) return false;

            Long parentId = parent.getId();
            if (parentId.equals(rootId)) return true;

            currentId = parentId;
        }
        return false;
    }
}