package org.thomcgn.backend.s8a.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.audit.model.AuditEventAction;
import org.thomcgn.backend.audit.service.AuditService;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.model.*;
import org.thomcgn.backend.s8a.repo.S8aCaseRepository;
import org.thomcgn.backend.s8a.repo.S8aEventRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class S8aService {

    private final S8aCaseRepository caseRepo;
    private final S8aEventRepository eventRepo;
    private final FalleroeffnungRepository falloeffnungRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;

    public S8aService(S8aCaseRepository caseRepo,
                      S8aEventRepository eventRepo,
                      FalleroeffnungRepository falloeffnungRepo,
                      UserRepository userRepo,
                      AccessControlService access,
                      AuditService audit) {
        this.caseRepo = caseRepo;
        this.eventRepo = eventRepo;
        this.falloeffnungRepo = falloeffnungRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public S8aCaseResponse createForFalleroeffnung(Long falleroeffnungId, CreateS8aForEpisodeRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        // WICHTIG: Fallöffnung scoped laden (sonst ID-Leak)
        var fall = falloeffnungRepo.findByIdWithRefsScoped(falleroeffnungId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        // Defense-in-depth: zusätzlich rollenbasiert (falls ihr später z.B. traegerweit lesen erlaubt)
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        User creator = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aCase c = new S8aCase();
        c.setFalleroeffnung(fall);
        c.setTraeger(fall.getTraeger());
        c.setEinrichtung(fall.getEinrichtungOrgUnit());
        c.setTitle(req.title());
        c.setStatus(S8aStatus.DRAFT);
        c.setRiskLevel(S8aRiskLevel.UNGEKLAERT);
        c.setCreatedBy(creator);

        S8aCase saved = caseRepo.save(c);

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(saved);
        ev.setType(S8aEventType.CREATED);
        ev.setText("§8a Vorgang erstellt");
        ev.setCreatedBy(creator);
        eventRepo.save(ev);

        audit.log(
                AuditEventAction.S8A_CREATED,
                "S8aCase",
                saved.getId(),
                fall.getEinrichtungOrgUnit().getId(),
                "S8a created for falloeffnung=" + falleroeffnungId
        );

        return get(saved.getId());
    }

    @Transactional
    public S8aEventResponse addEvent(Long s8aCaseId, AddS8aEventRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        S8aCase c = caseRepo.findByIdWithRefsScoped(s8aCaseId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        if (c.getStatus() == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only).");
        }

        S8aEventType type;
        try {
            type = S8aEventType.valueOf(req.type().trim());
        } catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown event type: " + req.type());
        }

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(type);
        ev.setText(req.text());
        ev.setPayloadJson(req.payloadJson());
        ev.setCreatedBy(actor);

        S8aEvent saved = eventRepo.save(ev);

        audit.log(
                AuditEventAction.S8A_EVENT_ADDED,
                "S8aCase",
                c.getId(),
                c.getEinrichtung().getId(),
                "Event added: " + type.name()
        );

        return new S8aEventResponse(
                saved.getId(),
                saved.getType().name(),
                saved.getText(),
                saved.getPayloadJson(),
                actor.getDisplayName(),
                saved.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public List<S8aCaseListItemResponse> listByFalleroeffnung(Long falleroeffnungId) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        // scoped Fallöffnung laden (verhindert Leak über fallId)
        var fall = falloeffnungRepo.findByIdWithRefsScoped(falleroeffnungId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return caseRepo.findAllByFalleroeffnungIdScopedOrderByCreatedAtDesc(falleroeffnungId, tid, oid).stream()
                .map(c -> new S8aCaseListItemResponse(
                        c.getId(),
                        c.getStatus().name(),
                        c.getRiskLevel().name(),
                        c.getTitle(),
                        c.getCreatedAt()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public S8aCaseResponse get(Long s8aCaseId) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        S8aCase c = caseRepo.findByIdWithRefsScoped(s8aCaseId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        var events = eventRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(s8aCaseId).stream()
                .map(e -> new S8aEventResponse(
                        e.getId(),
                        e.getType().name(),
                        e.getText(),
                        e.getPayloadJson(),
                        e.getCreatedBy().getDisplayName(),
                        e.getCreatedAt()
                ))
                .toList();

        return new S8aCaseResponse(
                c.getId(),
                c.getFalleroeffnung().getId(),
                c.getStatus().name(),
                c.getRiskLevel().name(),
                c.getTitle(),
                c.getCreatedBy().getDisplayName(),
                events
        );
    }

    @Transactional
    public S8aCaseResponse updateStatus(Long s8aCaseId, UpdateS8aStatusRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        S8aCase c = caseRepo.findByIdWithRefsScoped(s8aCaseId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        S8aStatus newStatus;
        try {
            newStatus = S8aStatus.valueOf(req.status().trim());
        } catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + req.status());
        }

        c.setStatus(newStatus);
        caseRepo.save(c);

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.STATUS_CHANGED);
        ev.setText("Status geändert zu: " + newStatus.name());
        ev.setCreatedBy(actor);
        eventRepo.save(ev);

        audit.log(
                AuditEventAction.S8A_STATUS_CHANGED,
                "S8aCase",
                c.getId(),
                c.getEinrichtung().getId(),
                "Status changed to " + newStatus.name()
        );

        return get(c.getId());
    }

    @Transactional
    public S8aCaseResponse updateRisk(Long s8aCaseId, UpdateS8aRiskRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        S8aCase c = caseRepo.findByIdWithRefsScoped(s8aCaseId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        if (c.getStatus() == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only).");
        }

        S8aRiskLevel newLevel;
        try {
            newLevel = S8aRiskLevel.valueOf(req.riskLevel().trim());
        } catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown riskLevel: " + req.riskLevel());
        }

        S8aRiskLevel old = c.getRiskLevel();
        if (old == newLevel) {
            return get(c.getId());
        }

        c.setRiskLevel(newLevel);
        caseRepo.save(c);

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.RISK_ASSESSMENT);
        ev.setText("Risiko geändert: " + old.name() + " -> " + newLevel.name());
        ev.setCreatedBy(actor);
        eventRepo.save(ev);

        audit.log(
                AuditEventAction.S8A_RISK_CHANGED,
                "S8aCase",
                c.getId(),
                c.getEinrichtung().getId(),
                "Risk changed to " + newLevel.name()
        );

        return get(c.getId());
    }
}