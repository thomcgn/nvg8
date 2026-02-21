package org.thomcgn.backend.audit.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.audit.model.AuditEvent;
import org.thomcgn.backend.audit.model.AuditEventAction;
import org.thomcgn.backend.audit.repo.AuditEventRepository;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

@Service
public class AuditService {

    private final AuditEventRepository repo;
    private final TraegerRepository traegerRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final UserRepository userRepository;

    public AuditService(AuditEventRepository repo,
                        TraegerRepository traegerRepository,
                        OrgUnitRepository orgUnitRepository,
                        UserRepository userRepository) {
        this.repo = repo;
        this.traegerRepository = traegerRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void log(AuditEventAction action, String entityType, Long entityId, Long orgUnitId, String message) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long userId = SecurityUtils.currentUserId();

        Traeger traeger = traegerRepository.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        OrgUnit orgUnit = null;
        if (orgUnitId != null) {
            orgUnit = orgUnitRepository.findById(orgUnitId).orElse(null);
        }

        AuditEvent ev = new AuditEvent();
        ev.setTraeger(traeger);
        ev.setUser(user);
        ev.setOrgUnit(orgUnit);
        ev.setAction(action);
        ev.setEntityType(entityType);
        ev.setEntityId(entityId);
        ev.setMessage(message);

        repo.save(ev);
    }
}