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
import org.thomcgn.backend.faelle.model.Fall;
import org.thomcgn.backend.faelle.repo.FallRepository;
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
    private final FallRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;

    public S8aService(S8aCaseRepository caseRepo,
                      S8aEventRepository eventRepo,
                      FallRepository fallRepo,
                      UserRepository userRepo,
                      AccessControlService access,
                      AuditService audit) {
        this.caseRepo = caseRepo;
        this.eventRepo = eventRepo;
        this.fallRepo = fallRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
    }

    @Transactional
    public S8aCaseResponse create(CreateS8aCaseRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Fall fall = fallRepo.findByIdWithRefs(req.fallId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        User creator = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aCase c = new S8aCase();
        c.setFall(fall);
        c.setTraeger(fall.getTraeger());
        c.setEinrichtung(fall.getEinrichtungOrgUnit());
        c.setTitle(req.title());
        c.setStatus(S8aStatus.DRAFT);
        c.setRiskLevel(S8aRiskLevel.UNGEKLAERT);
        c.setCreatedBy(creator);

        S8aCase saved = caseRepo.save(c);

        // created event
        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(saved);
        ev.setType(S8aEventType.CREATED);
        ev.setText("§8a Vorgang erstellt");
        ev.setCreatedBy(creator);
        eventRepo.save(ev);

        audit.log(AuditEventAction.S8A_CREATED, "S8aCase", saved.getId(), saved.getEinrichtung().getId(), "S8a case created");

        return get(saved.getId());
    }

    @Transactional(readOnly = true)
    public S8aCaseResponse get(Long s8aCaseId) {
        S8aCase c = caseRepo.findByIdWithRefs(s8aCaseId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        List<S8aEventResponse> events = eventRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(s8aCaseId)
                .stream()
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
                c.getFall().getId(),
                c.getStatus().name(),
                c.getRiskLevel().name(),
                c.getTitle(),
                c.getCreatedBy().getDisplayName(),
                events
        );
    }

    @Transactional
    public S8aEventResponse addEvent(Long s8aCaseId, AddS8aEventRequest req) {
        S8aCase c = caseRepo.findByIdWithRefs(s8aCaseId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        if (c.getStatus() == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only).");
        }

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.SCHREIBEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        S8aEventType type;
        try { type = S8aEventType.valueOf(req.type().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown event type: " + req.type()); }

        User author = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(type);
        ev.setPayloadJson(req.payloadJson());
        ev.setText(req.text());
        ev.setCreatedBy(author);

        S8aEvent saved = eventRepo.save(ev);

        audit.log(AuditEventAction.S8A_EVENT_ADDED, "S8aCase", c.getId(), c.getEinrichtung().getId(), "S8a event: " + type);

        return new S8aEventResponse(saved.getId(), saved.getType().name(), saved.getText(),
                saved.getPayloadJson(), author.getDisplayName(), saved.getCreatedAt());
    }

    @Transactional
    public S8aCaseResponse updateStatus(Long s8aCaseId, UpdateS8aStatusRequest req) {
        S8aCase c = caseRepo.findByIdWithRefs(s8aCaseId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        S8aStatus newStatus;
        try { newStatus = S8aStatus.valueOf(req.status().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + req.status()); }

        S8aStatus old = c.getStatus();
        if (old == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Closed s8a cannot change status.");
        }

        c.setStatus(newStatus);

        User author = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(newStatus == S8aStatus.ABGESCHLOSSEN ? S8aEventType.CLOSED : S8aEventType.STATUS_CHANGED);
        ev.setText("Status: " + old + " -> " + newStatus);
        ev.setCreatedBy(author);
        eventRepo.save(ev);

        audit.log(AuditEventAction.S8A_STATUS_CHANGED, "S8aCase", c.getId(), c.getEinrichtung().getId(), "S8a status changed");

        return get(s8aCaseId);
    }

    @Transactional
    public S8aCaseResponse updateRisk(Long s8aCaseId, UpdateS8aRiskRequest req) {
        S8aCase c = caseRepo.findByIdWithRefs(s8aCaseId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        if (c.getStatus() == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only).");
        }

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        S8aRiskLevel newLevel;
        try { newLevel = S8aRiskLevel.valueOf(req.riskLevel().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown riskLevel: " + req.riskLevel()); }

        S8aRiskLevel old = c.getRiskLevel();
        if (old == newLevel) return get(s8aCaseId);

        c.setRiskLevel(newLevel);

        User author = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.RISK_ASSESSMENT);
        ev.setText("Risiko: " + old + " -> " + newLevel);
        ev.setCreatedBy(author);
        eventRepo.save(ev);

        audit.log(AuditEventAction.S8A_RISK_CHANGED, "S8aCase", c.getId(), c.getEinrichtung().getId(), "S8a risk changed");

        return get(s8aCaseId);
    }

    @Transactional(readOnly = true)
    public java.util.List<S8aCaseListItemResponse> listByFall(Long fallId) {
        Fall fall = fallRepo.findByIdWithRefs(fallId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return caseRepo.findAllByFallIdOrderByCreatedAtDesc(fallId).stream()
                .map(c -> new S8aCaseListItemResponse(
                        c.getId(),
                        c.getStatus().name(),
                        c.getRiskLevel().name(),
                        c.getTitle(),
                        c.getCreatedAt()
                ))
                .toList();
    }
}