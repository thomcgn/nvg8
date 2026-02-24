package org.thomcgn.backend.s8a.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.audit.model.AuditEventAction;
import org.thomcgn.backend.audit.service.AuditService;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.model.*;
import org.thomcgn.backend.s8a.repo.S8aAssessmentRepository;
import org.thomcgn.backend.s8a.repo.S8aCaseRepository;
import org.thomcgn.backend.s8a.repo.S8aEventRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.Collections;
import java.util.List;

/**
 * Fachliche Einschätzung (§8a) als versioniertes Domain-Objekt.
 *
 * Design:
 * - Bewertung ist NICHT ein Freitext-Event, sondern strukturiert & versioniert.
 * - Timeline erhält optional ein Event "ASSESSMENT_SAVED" mit Referenz auf die Version (payloadJson).
 * - Zugriff:
 *   - lesen: Role.LESEN + alle Schreibrollen
 *   - schreiben: Fachkraft/Teamleitung/Admin
 */
@Service
public class S8aAssessmentService {

    private final S8aAssessmentRepository assessmentRepo;
    private final S8aCaseRepository caseRepo;
    private final S8aEventRepository eventRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;
    private final ObjectMapper om;

    private static final TypeReference<List<String>> LIST_OF_STRING = new TypeReference<>() {};

    public S8aAssessmentService(S8aAssessmentRepository assessmentRepo,
                                S8aCaseRepository caseRepo,
                                S8aEventRepository eventRepo,
                                UserRepository userRepo,
                                AccessControlService access,
                                AuditService audit,
                                ObjectMapper om) {
        this.assessmentRepo = assessmentRepo;
        this.caseRepo = caseRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
        this.om = om;
    }

    @Transactional(readOnly = true)
    public S8aAssessmentResponse getLatest(Long s8aCaseId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        S8aAssessment a = assessmentRepo.findTopByS8aCaseIdOrderByVersionDesc(c.getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "No assessment found"));

        return map(a);
    }

    @Transactional(readOnly = true)
    public S8aAssessmentResponse getVersion(Long s8aCaseId, int version) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        S8aAssessment a = assessmentRepo.findByS8aCaseIdAndVersion(c.getId(), version)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Assessment version not found"));
        return map(a);
    }

    @Transactional(readOnly = true)
    public List<S8aAssessmentVersionItemResponse> listVersions(Long s8aCaseId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        return assessmentRepo.findAllByS8aCaseIdOrderByVersionDesc(c.getId()).stream()
                .map(a -> new S8aAssessmentVersionItemResponse(
                        a.getVersion(),
                        a.getGefaehrdungsart().name(),
                        a.getCreatedBy().getDisplayName(),
                        a.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public S8aAssessmentResponse saveNewVersion(Long s8aCaseId, SaveS8aAssessmentRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        S8aCase c = loadCaseScoped(s8aCaseId, false);
        if (c.getStatus() == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only). ");
        }

        // Validierung: Enum-Mapping serverseitig, damit DB sauber bleibt
        S8aGefaehrdungsart art;
        try {
            art = S8aGefaehrdungsart.valueOf(req.gefaehrdungsart().trim());
        } catch (Exception e) {
            throw DomainException.badRequest(
                    ErrorCode.VALIDATION_FAILED,
                    "Unknown gefaehrdungsart: " + req.gefaehrdungsart()
            );
        }

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        int nextVersion = assessmentRepo.findMaxVersion(c.getId()) + 1;

        S8aAssessment a = new S8aAssessment();
        a.setS8aCase(c);
        a.setVersion(nextVersion);
        a.setGefaehrdungsart(art);
        a.setKindesanhoerung(req.kindesanhoerung());
        a.setIefkBeteiligt(req.iefkBeteiligt());
        a.setJugendamtInformiert(req.jugendamtInformiert());
        a.setCreatedBy(actor);
        a.setBeteiligteJson(writeBeteiligte(req.beteiligte()));

        S8aAssessment saved = assessmentRepo.save(a);

        // Timeline-Event: sichtbar, aber NICHT Freitext als fachliche Quelle.
        // Wir referenzieren die Version revisionssicher.
        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.ASSESSMENT_SAVED);
        ev.setText("Schutzkonzept / Einschätzung gespeichert (v" + nextVersion + ")");
        ev.setPayloadJson("{\"assessmentVersion\":" + nextVersion + "}");
        ev.setCreatedBy(actor);
        eventRepo.save(ev);

        // Audit: Wer hat was wann gespeichert?
        audit.log(
                AuditEventAction.S8A_ASSESSMENT_SAVED,
                "S8aCase",
                c.getId(),
                c.getEinrichtung().getId(),
                "Assessment saved v" + nextVersion
        );

        return map(saved);
    }

    private S8aCase loadCaseScoped(Long s8aCaseId, boolean allowReadOnlyRole) {
        if (allowReadOnlyRole) {
            access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        } else {
            access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        }

        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        S8aCase c = caseRepo.findByIdWithRefsScoped(s8aCaseId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "S8a case not found"));

        access.requireAccessToEinrichtungObject(
                c.getTraeger().getId(),
                c.getEinrichtung().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );
        return c;
    }

    private String writeBeteiligte(List<String> beteiligte) {
        try {
            List<String> safe = beteiligte == null ? Collections.emptyList() : beteiligte;
            return om.writeValueAsString(safe);
        } catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Invalid beteiligte payload");
        }
    }

    private List<String> readBeteiligte(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return om.readValue(json, LIST_OF_STRING);
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private S8aAssessmentResponse map(S8aAssessment a) {
        return new S8aAssessmentResponse(
                a.getId(),
                a.getS8aCase().getId(),
                a.getVersion(),
                a.getGefaehrdungsart().name(),
                readBeteiligte(a.getBeteiligteJson()),
                a.isKindesanhoerung(),
                a.isIefkBeteiligt(),
                a.isJugendamtInformiert(),
                a.getCreatedBy().getDisplayName(),
                a.getCreatedAt()
        );
    }
}