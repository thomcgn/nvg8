package org.thomcgn.backend.auth.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.dto.AuthContextResponse;
import org.thomcgn.backend.auth.dto.SwitchContextRequest;
import org.thomcgn.backend.auth.dto.SwitchContextResponse;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.common.security.JwtService;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.model.UserOrgRole;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.*;

@Service
public class AuthContextService {

    private final UserRepository userRepository;
    private final TraegerRepository traegerRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final JwtService jwtService;

    public AuthContextService(UserRepository userRepository,
                              TraegerRepository traegerRepository,
                              OrgUnitRepository orgUnitRepository,
                              JwtService jwtService) {
        this.userRepository = userRepository;
        this.traegerRepository = traegerRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.jwtService = jwtService;
    }

    /**
     * Liefert alle auswählbaren Kontexte (Traeger + EINRICHTUNG) für den eingeloggten User.
     * Ein User kann Rollen in mehreren Teams/Ebenen haben -> wir gruppieren auf EINRICHTUNG.
     */
    @Transactional(readOnly = true)
    public List<AuthContextResponse> listContexts() {
        Long userId = SecurityUtils.currentUserId();

        User user = userRepository.findByIdWithOrgRoles(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        // key = "traegerId:einrichtungId" -> roles
        Map<String, Set<String>> rolesByCtx = new LinkedHashMap<>();

        for (UserOrgRole uor : user.getOrgRoles()) {
            if (!uor.isEnabled()) continue;

            OrgUnit ou = uor.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;
            if (ou.getTraeger() == null || !ou.getTraeger().isEnabled()) continue;

            Long traegerId = ou.getTraeger().getId();
            Long einrichtungId = findEinrichtungAncestorId(ou);

            if (einrichtungId == null) continue;

            String key = traegerId + ":" + einrichtungId;
            rolesByCtx.computeIfAbsent(key, k -> new HashSet<>()).add(uor.getRole().name());
        }

        List<AuthContextResponse> out = new ArrayList<>();

        for (var entry : rolesByCtx.entrySet()) {
            String key = entry.getKey();
            String[] parts = key.split(":");
            Long traegerId = Long.valueOf(parts[0]);
            Long einrichtungId = Long.valueOf(parts[1]);

            Traeger traeger = traegerRepository.findById(traegerId).orElse(null);
            OrgUnit einr = orgUnitRepository.findById(einrichtungId).orElse(null);
            if (traeger == null || einr == null) continue;

            out.add(new AuthContextResponse(
                    traegerId,
                    traeger.getName(),
                    einrichtungId,
                    einr.getName(),
                    entry.getValue()
            ));
        }

        return out;
    }

    /**
     * Switch Context: validiert, dass User im gewünschten (Traeger + EINRICHTUNG) Kontext Rollen hat,
     * und mintet ctx-JWT mit tid+oid+roles.
     */
    @Transactional(readOnly = true)
    public SwitchContextResponse switchContext(SwitchContextRequest req) {
        Long userId = SecurityUtils.currentUserId();

        User user = userRepository.findByIdWithOrgRoles(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        // alle Rollen, die in dieser EINRICHTUNG (egal welches Team darunter) liegen
        Set<String> ctxRoles = new HashSet<>();

        for (UserOrgRole uor : user.getOrgRoles()) {
            if (!uor.isEnabled()) continue;

            OrgUnit ou = uor.getOrgUnit();
            if (ou == null || !ou.isEnabled()) continue;

            if (ou.getTraeger() == null || !ou.getTraeger().getId().equals(req.traegerId())) continue;

            Long einrichtungId = findEinrichtungAncestorId(ou);
            if (einrichtungId != null && einrichtungId.equals(req.einrichtungOrgUnitId())) {
                ctxRoles.add(uor.getRole().name());
            }
        }

        if (ctxRoles.isEmpty()) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Context not allowed for user.");
        }

        // optional: check that requested org unit really is EINRICHTUNG + belongs to traeger
        OrgUnit einr = orgUnitRepository.findById(req.einrichtungOrgUnitId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Einrichtung not found"));

        if (einr.getType() != OrgUnitType.EINRICHTUNG) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "orgUnitId must be EINRICHTUNG");
        }
        if (einr.getTraeger() == null || !einr.getTraeger().getId().equals(req.traegerId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Einrichtung not within Traeger.");
        }

        String token = jwtService.issueContextToken(
                user.getId(),
                req.traegerId(),
                req.einrichtungOrgUnitId(),
                ctxRoles.stream().sorted().toList(),
                user.getEmail()
        );

        return new SwitchContextResponse(token);
    }

    // --------------------
    // Helpers
    // --------------------

    /**
     * Steigt im OrgUnit-Baum hoch bis EINRICHTUNG.
     * Wir nutzen die Entity-Refs (parent) soweit geladen; sonst fallback auf repo.
     */
    private Long findEinrichtungAncestorId(OrgUnit start) {
        OrgUnit current = start;
        int guard = 0;

        while (current != null && guard++ < 50) {
            if (current.getType() == OrgUnitType.EINRICHTUNG) return current.getId();

            if (current.getParent() != null) {
                current = current.getParent();
            } else {
                // fallback: wenn parent nicht geladen ist oder null
                // (wenn null, dann keine Einrichtung gefunden)
                return null;
            }
        }
        return null;
    }
}