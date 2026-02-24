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

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class S8aAssessmentService {

    private final S8aAssessmentRepository assessmentRepo;
    private final S8aAssessmentParticipantRepository participantRepo;
    private final S8aCasePersonRepository casePersonRepo;
    private final S8aCustodyRecordRepository custodyRepo;
    private final S8aContactRestrictionRepository contactRestrictionRepo;
    private final S8aCaseRepository caseRepo;
    private final S8aEventRepository eventRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;

    public S8aAssessmentService(S8aAssessmentRepository assessmentRepo,
                                S8aAssessmentParticipantRepository participantRepo,
                                S8aCasePersonRepository casePersonRepo,
                                S8aCustodyRecordRepository custodyRepo,
                                S8aContactRestrictionRepository contactRestrictionRepo,
                                S8aCaseRepository caseRepo,
                                S8aEventRepository eventRepo,
                                UserRepository userRepo,
                                AccessControlService access,
                                AuditService audit) {
        this.assessmentRepo = assessmentRepo;
        this.participantRepo = participantRepo;
        this.casePersonRepo = casePersonRepo;
        this.custodyRepo = custodyRepo;
        this.contactRestrictionRepo = contactRestrictionRepo;
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

    @Transactional(readOnly = true)
    public S8aAssessmentResponse getVersion(Long s8aCaseId, int version) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        S8aAssessment a = assessmentRepo.findByS8aCaseIdAndVersion(c.getId(), version)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Assessment version not found"));

        return map(a);
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

        // ✅ Duplikate verhindern
        Set<Long> seen = new HashSet<>();
        for (S8aAssessmentParticipantDto p : req.beteiligte()) {
            if (p.casePersonId() == null) continue;
            if (!seen.add(p.casePersonId())) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Duplicate casePersonId in beteiligte: " + p.casePersonId());
            }
        }

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

        S8aAssessment saved = assessmentRepo.save(a);

        for (S8aAssessmentParticipantDto p : req.beteiligte()) {
            if (p.casePersonId() == null) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "participant.casePersonId is required");
            }
            if (p.roleInAssessment() == null || p.roleInAssessment().isBlank()) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "participant.roleInAssessment is required");
            }

            S8aCasePerson person = casePersonRepo.findById(p.casePersonId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "casePerson not found: " + p.casePersonId()));

            if (!person.getS8aCase().getId().equals(c.getId())) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "casePerson does not belong to this s8aCase");
            }

            // ✅ Strenge Regel:
            // Wenn Participant NICHT Kind ist und mindestens ein Snapshot-Feld leer ist,
            // dann muss childCasePersonId gesetzt sein, damit Auto-Snapshots möglich sind.
            boolean needsAuto = isBlank(p.custodySnapshot())
                    || isBlank(p.residenceRightSnapshot())
                    || isBlank(p.contactSnapshot())
                    || isBlank(p.restrictionSnapshot());

            if (person.getPersonType() != S8aPersonType.KIND && needsAuto && p.childCasePersonId() == null) {
                throw DomainException.badRequest(
                        ErrorCode.VALIDATION_FAILED,
                        "childCasePersonId is required for non-KIND participant when snapshot fields are missing (casePersonId=" + p.casePersonId() + ")"
                );
            }

            S8aCasePerson child = resolveChildContext(c.getId(), person, p.childCasePersonId());
            SnapshotPack auto = buildAutoSnapshots(c.getId(), child, person);

            S8aAssessmentParticipant ap = new S8aAssessmentParticipant();
            ap.setAssessment(saved);
            ap.setCasePerson(person);
            ap.setRoleInAssessment(p.roleInAssessment());

            ap.setCustodySnapshot(firstNonBlank(p.custodySnapshot(), auto.custodySnapshot()));
            ap.setResidenceRightSnapshot(firstNonBlank(p.residenceRightSnapshot(), auto.residenceRightSnapshot()));
            ap.setContactSnapshot(firstNonBlank(p.contactSnapshot(), auto.contactSnapshot()));
            ap.setRestrictionSnapshot(firstNonBlank(p.restrictionSnapshot(), auto.restrictionSnapshot()));
            ap.setNotes(p.notes());

            participantRepo.save(ap);
        }

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
                                null, // childCasePersonId nur fürs Schreiben/Auto-Snapshot
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

    private S8aCasePerson resolveChildContext(Long caseId, S8aCasePerson person, Long childCasePersonId) {
        if (childCasePersonId != null) {
            S8aCasePerson child = casePersonRepo.findById(childCasePersonId)
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "childCasePerson not found: " + childCasePersonId));

            if (!child.getS8aCase().getId().equals(caseId)) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "childCasePerson does not belong to this s8aCase");
            }
            if (child.getPersonType() != S8aPersonType.KIND) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "childCasePersonId must reference a KIND person");
            }
            return child;
        }

        if (person.getPersonType() == S8aPersonType.KIND) {
            return person;
        }

        return null;
    }

    private SnapshotPack buildAutoSnapshots(Long caseId, S8aCasePerson child, S8aCasePerson person) {
        if (child == null) return SnapshotPack.empty();

        var custodyOpt = custodyRepo.findTopByS8aCaseIdAndChildPersonIdAndRightHolderPersonIdOrderByCreatedAtDesc(
                caseId, child.getId(), person.getId()
        );

        String custody = custodyOpt.map(cr -> {
            String src = formatSource(cr.getSourceTitle(), cr.getSourceReference());
            String s = "Sorgerecht: " + cr.getCustodyType().name();
            if (!isBlank(cr.getValidFrom())) s += " (ab " + cr.getValidFrom() + ")";
            if (src != null) s += " | Quelle: " + src;
            return s;
        }).orElse(null);

        String residence = custodyOpt.map(cr -> {
            String src = formatSource(cr.getSourceTitle(), cr.getSourceReference());
            String s = "Aufenthaltsbestimmungsrecht: " + cr.getResidenceRight().name();
            if (!isBlank(cr.getValidFrom())) s += " (ab " + cr.getValidFrom() + ")";
            if (src != null) s += " | Quelle: " + src;
            return s;
        }).orElse(null);

        var restrOpt = contactRestrictionRepo.findTopByS8aCaseIdAndChildPersonIdAndOtherPersonIdOrderByCreatedAtDesc(
                caseId, child.getId(), person.getId()
        );

        String restriction = restrOpt.map(r -> {
            String src = formatSource(r.getSourceTitle(), r.getSourceReference());
            String s = "Kontaktregelung: " + r.getRestrictionType().name();
            if (!isBlank(r.getReason())) s += " | Grund: " + r.getReason();
            if (src != null) s += " | Quelle: " + src;
            return s;
        }).orElse(null);

        // optional: contactSnapshot separat
        String contact = null;

        return new SnapshotPack(custody, residence, contact, restriction);
    }

    private String firstNonBlank(String preferred, String fallback) {
        if (!isBlank(preferred)) return preferred;
        return fallback;
    }

    private String formatSource(String title, String ref) {
        boolean t = !isBlank(title);
        boolean r = !isBlank(ref);
        if (!t && !r) return null;
        if (t && !r) return title;
        if (!t) return ref;
        return title + " (" + ref + ")";
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private record SnapshotPack(String custodySnapshot,
                                String residenceRightSnapshot,
                                String contactSnapshot,
                                String restrictionSnapshot) {
        static SnapshotPack empty() { return new SnapshotPack(null, null, null, null); }
    }
}