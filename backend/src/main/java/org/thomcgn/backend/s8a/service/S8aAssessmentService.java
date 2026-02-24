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
import org.thomcgn.backend.s8a.dto.S8aAssessmentParticipantDto;
import org.thomcgn.backend.s8a.dto.SaveS8aAssessmentRequest;
import org.thomcgn.backend.s8a.dto.S8aAssessmentResponse;
import org.thomcgn.backend.s8a.dto.S8aAssessmentVersionItemResponse;
import org.thomcgn.backend.s8a.model.*;
import org.thomcgn.backend.s8a.repo.*;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

/**
 * Fachliche Einschätzung (§8a) als versioniertes Domain-Objekt.
 *
 * Refactor:
 * - Beteiligte werden NICHT mehr als JSON in S8aAssessment gespeichert,
 *   sondern relational über S8aAssessmentParticipant (revisionssicher, querybar).
 */
@Service
public class S8aAssessmentService {

    private final S8aAssessmentRepository assessmentRepo;
    private final S8aAssessmentParticipantRepository participantRepo;
    private final S8aCasePersonRepository casePersonRepo;
    private final S8aCaseRepository caseRepo;
    private final S8aEventRepository eventRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;

    public S8aAssessmentService(S8aAssessmentRepository assessmentRepo,
                                S8aAssessmentParticipantRepository participantRepo,
                                S8aCasePersonRepository casePersonRepo,
                                S8aCaseRepository caseRepo,
                                S8aEventRepository eventRepo,
                                UserRepository userRepo,
                                AccessControlService access,
                                AuditService audit) {
        this.assessmentRepo = assessmentRepo;
        this.participantRepo = participantRepo;
        this.casePersonRepo = casePersonRepo;
        this.caseRepo = caseRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
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
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only).");
        }

        if (req.beteiligte() == null || req.beteiligte().isEmpty()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "beteiligte must not be empty");
        }

        S8aGefaehrdungsart art;
        try {
            art = S8aGefaehrdungsart.valueOf(req.gefaehrdungsart().trim());
        } catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown gefaehrdungsart: " + req.gefaehrdungsart());
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

        S8aAssessment saved = assessmentRepo.save(a);

        // Participants persistieren (revisionssichere Beteiligtenliste)
        for (S8aAssessmentParticipantDto p : req.beteiligte()) {
            if (p.casePersonId() == null) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "participant.casePersonId is required");
            }
            if (p.roleInAssessment() == null || p.roleInAssessment().isBlank()) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "participant.roleInAssessment is required");
            }

            S8aCasePerson cp = casePersonRepo.findById(p.casePersonId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "casePerson not found: " + p.casePersonId()));

            // Sicherheits-/Domain-Check: Person muss zum selben Case gehören
            if (!cp.getS8aCase().getId().equals(c.getId())) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "casePerson does not belong to this s8aCase");
            }

            S8aAssessmentParticipant ap = new S8aAssessmentParticipant();
            ap.setAssessment(saved);
            ap.setCasePerson(cp);
            ap.setRoleInAssessment(p.roleInAssessment());
            ap.setCustodySnapshot(p.custodySnapshot());
            ap.setResidenceRightSnapshot(p.residenceRightSnapshot());
            ap.setContactSnapshot(p.contactSnapshot());
            ap.setRestrictionSnapshot(p.restrictionSnapshot());
            ap.setNotes(p.notes());

            participantRepo.save(ap);
        }

        // Timeline-Event (nur Hinweis/Referenz, nicht als fachliche Quelle)
        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.ASSESSMENT_SAVED);
        ev.setText("Schutzkonzept / Einschätzung gespeichert (v" + nextVersion + ")");
        ev.setPayloadJson("{\"assessmentVersion\":" + nextVersion + "}");
        ev.setCreatedBy(actor);
        eventRepo.save(ev);

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

    private S8aAssessmentResponse map(S8aAssessment a) {
        List<S8aAssessmentParticipantDto> participants =
                participantRepo.findAllByAssessmentIdOrderByIdAsc(a.getId()).stream()
                        .map(p -> new S8aAssessmentParticipantDto(
                                p.getCasePerson().getId(),
                                p.getRoleInAssessment(),
                                p.getCustodySnapshot(),
                                p.getResidenceRightSnapshot(),
                                p.getContactSnapshot(),
                                p.getRestrictionSnapshot(),
                                p.getNotes()
                        ))
                        .toList();

        return new S8aAssessmentResponse(
                a.getId(),
                a.getS8aCase().getId(),
                a.getVersion(),
                a.getGefaehrdungsart().name(),
                participants,
                a.isKindesanhoerung(),
                a.isIefkBeteiligt(),
                a.isJugendamtInformiert(),
                a.getCreatedBy().getDisplayName(),
                a.getCreatedAt()
        );
    }
}