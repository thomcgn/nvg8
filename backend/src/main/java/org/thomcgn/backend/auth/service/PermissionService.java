package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Component;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;

import java.util.*;

@Component("perm")
public class PermissionService {

    private final OrgUnitRepository orgUnitRepository;

    public PermissionService(OrgUnitRepository orgUnitRepository) {
        this.orgUnitRepository = orgUnitRepository;
    }

    // ---------------------------------------------------
    // Basic role helpers
    // ---------------------------------------------------

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

    // ---------------------------------------------------
    // OrgUnit permission
    // ---------------------------------------------------

    public boolean canManageOrgUnit(Long targetOrgUnitId) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long activeOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        OrgUnit target = orgUnitRepository.findById(targetOrgUnitId).orElse(null);
        if (target == null) return false;

        if (!target.getTraeger().getId().equals(traegerId)) return false;

        if (has(Role.TRAEGER_ADMIN)) return true;

        if (!has(Role.EINRICHTUNG_ADMIN)) return false;

        return isDescendantOrSame(target.getId(), findEinrichtungRoot(activeOrgUnitId));
    }

    public OrgUnit requireOrgScope(Long targetOrgUnitId) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long activeOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        OrgUnit target = orgUnitRepository.findById(targetOrgUnitId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "OrgUnit not found: " + targetOrgUnitId));

        if (!target.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Cross-traeger org unit denied.");
        }

        if (has(Role.TRAEGER_ADMIN)) return target;

        Long einrichtungRoot = findEinrichtungRoot(activeOrgUnitId);
        if (!isDescendantOrSame(target.getId(), einrichtungRoot)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Target is outside your Einrichtung scope.");
        }

        return target;
    }

    // ---------------------------------------------------
    // Fall permissions (object-based checks)
    // ---------------------------------------------------

    public boolean canReadFall(Long fallId) {
        // Optional: wenn du canReadFall per DB willst, mach das im FallService oder via Repo.
        // Für @PreAuthorize ist es okay, aber hier lassen wir es bewusst "neutral".
        return hasAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
    }

    public boolean canWriteFall(Long fallId) {
        return hasAny(Role.SCHREIBEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
    }

    /**
     * IDs von Einrichtungen, auf die der aktuelle Kontext scope-mäßig Zugriff hat.
     * Für die Fall-Liste brauchen wir stabile Filter auf Einrichtungsebene.
     */
    public Set<Long> allowedEinrichtungIdsForListing() {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long activeOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        List<OrgUnit> all = orgUnitRepository.findAllEnabledByTraegerId(traegerId);

        if (has(Role.TRAEGER_ADMIN)) {
            Set<Long> ids = new HashSet<>();
            for (OrgUnit ou : all) {
                if (ou.getType() == OrgUnitType.EINRICHTUNG) ids.add(ou.getId());
            }
            return ids;
        }

        Long einrichtungId = findEinrichtungRootId(activeOrgUnitId, all);
        if (einrichtungId == null) return Set.of();

        return Set.of(einrichtungId);
    }

    // ---------------------------------------------------
    // Scope helpers
    // ---------------------------------------------------

    private Long findEinrichtungRoot(Long activeOrgUnitId) {
        Long current = activeOrgUnitId;

        while (current != null) {
            OrgUnit ou = orgUnitRepository.findById(current).orElse(null);
            if (ou == null) return null;

            if (ou.getType() == OrgUnitType.EINRICHTUNG) {
                return ou.getId();
            }

            if (ou.getParent() == null) return null;

            current = ou.getParent().getId();
        }
        return null;
    }

    private boolean isDescendantOrSame(Long targetId, Long rootId) {
        if (rootId == null) return false;
        if (targetId.equals(rootId)) return true;

        Long current = targetId;
        while (current != null) {
            OrgUnit ou = orgUnitRepository.findById(current).orElse(null);
            if (ou == null || ou.getParent() == null) return false;

            if (ou.getParent().getId().equals(rootId)) return true;

            current = ou.getParent().getId();
        }
        return false;
    }

    private Long findEinrichtungRootId(Long startId, List<OrgUnit> all) {
        Map<Long, OrgUnit> map = new HashMap<>();
        for (OrgUnit ou : all) map.put(ou.getId(), ou);

        Set<Long> visited = new HashSet<>();
        Long current = startId;

        while (current != null) {
            if (!visited.add(current)) return null;
            OrgUnit ou = map.get(current);
            if (ou == null) return null;

            if (ou.getType() == OrgUnitType.EINRICHTUNG) return ou.getId();

            if (ou.getParent() == null) return null;
            current = ou.getParent().getId();
        }
        return null;
    }
}