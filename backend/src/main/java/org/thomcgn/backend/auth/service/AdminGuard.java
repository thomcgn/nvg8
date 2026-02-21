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
public class AdminGuard {

    private final OrgUnitRepository orgUnitRepository;

    public AdminGuard(OrgUnitRepository orgUnitRepository) {
        this.orgUnitRepository = orgUnitRepository;
    }

    public OrgUnit requireCanManageOrgUnit(Long targetOrgUnitId) {
        Long currentTraegerId = SecurityUtils.currentTraegerIdRequired();
        Long activeOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        OrgUnit target = orgUnitRepository.findById(targetOrgUnitId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "OrgUnit not found: " + targetOrgUnitId));

        // Immer Traeger-isolation
        if (!target.getTraeger().getId().equals(currentTraegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Cannot manage org units of another Traeger.");
        }

        boolean hasTraegerAdmin = hasRole(Role.TRAEGER_ADMIN);
        boolean hasEinrichtungAdmin = hasRole(Role.EINRICHTUNG_ADMIN);

        if (!hasTraegerAdmin && !hasEinrichtungAdmin) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Admin role required.");
        }

        if (hasTraegerAdmin) {
            return target; // im ganzen Träger erlaubt
        }

        // EINRICHTUNG_ADMIN: nur innerhalb seiner Einrichtung + Unterbaum
        OrgUnit einrichtungRoot = findEinrichtungRoot(activeOrgUnitId);

        // Falls der Kontext gar nicht in einer Einrichtung hängt => deny
        if (einrichtungRoot == null) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Active context is not within an Einrichtung tree.");
        }

        boolean ok = isDescendantOrSame(target.getId(), einrichtungRoot.getId());
        if (!ok) {
            throw DomainException.forbidden(
                    ErrorCode.ACCESS_DENIED,
                    "EINRICHTUNG_ADMIN may only manage within its Einrichtung subtree."
            );
        }

        return target;
    }

    private boolean hasRole(Role role) {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        String required = "ROLE_" + role.name();
        return auth.getAuthorities().stream().anyMatch(a -> required.equals(a.getAuthority()));
    }

    /**
     * Walk parents from activeOrgUnit up to first EINRICHTUNG.
     * Returns null if none found.
     */
    private OrgUnit findEinrichtungRoot(Long activeOrgUnitId) {
        Set<Long> visited = new HashSet<>();
        Long currentId = activeOrgUnitId;

        while (currentId != null) {
            if (!visited.add(currentId)) {
                // cycle protection
                throw DomainException.conflict(ErrorCode.CONFLICT, "OrgUnit parent cycle detected.");
            }

            Long finalCurrentId = currentId;
            OrgUnit current = orgUnitRepository.findById(currentId)
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "OrgUnit not found: " + finalCurrentId));

            if (current.getType() == OrgUnitType.EINRICHTUNG) {
                return current;
            }

            // Wenn wir beim TRÄGER-root ankommen ohne Einrichtung => null
            if (current.getType() == OrgUnitType.TRAEGER || current.getParent() == null) {
                return null;
            }

            currentId = current.getParent().getId();
        }
        return null;
    }

    /**
     * Checks if target is the same as root OR is a descendant of root (via parent links).
     */
    private boolean isDescendantOrSame(Long targetId, Long rootId) {
        if (targetId.equals(rootId)) return true;

        Set<Long> visited = new HashSet<>();
        Long currentId = targetId;

        while (currentId != null) {
            if (!visited.add(currentId)) {
                throw DomainException.conflict(ErrorCode.CONFLICT, "OrgUnit parent cycle detected.");
            }

            Long finalCurrentId = currentId;
            OrgUnit current = orgUnitRepository.findById(currentId)
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "OrgUnit not found: " + finalCurrentId));

            OrgUnit parent = current.getParent();
            if (parent == null) return false;

            Long parentId = parent.getId();
            if (parentId.equals(rootId)) return true;

            currentId = parentId;
        }
        return false;
    }
}