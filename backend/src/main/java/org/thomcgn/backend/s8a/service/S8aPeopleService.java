package org.thomcgn.backend.s8a.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.model.*;
import org.thomcgn.backend.s8a.repo.*;

import java.util.List;

@Service
public class S8aPeopleService {

    private final S8aCaseRepository caseRepo;
    private final S8aCasePersonRepository personRepo;
    private final S8aCasePersonRelationRepository relationRepo;
    private final S8aCustodyRecordRepository custodyRepo;
    private final S8aContactRestrictionRepository contactRepo;
    private final S8aOrderRepository orderRepo;
    private final AccessControlService access;

    public S8aPeopleService(S8aCaseRepository caseRepo,
                            S8aCasePersonRepository personRepo,
                            S8aCasePersonRelationRepository relationRepo,
                            S8aCustodyRecordRepository custodyRepo,
                            S8aContactRestrictionRepository contactRepo,
                            S8aOrderRepository orderRepo,
                            AccessControlService access) {
        this.caseRepo = caseRepo;
        this.personRepo = personRepo;
        this.relationRepo = relationRepo;
        this.custodyRepo = custodyRepo;
        this.contactRepo = contactRepo;
        this.orderRepo = orderRepo;
        this.access = access;
    }

    // ---------- LIST ----------

    @Transactional(readOnly = true)
    public List<S8aCasePersonResponse> listPersons(Long s8aCaseId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);
        return personRepo.findAllByS8aCaseIdOrderByIdAsc(c.getId()).stream()
                .map(p -> new S8aCasePersonResponse(
                        p.getId(), c.getId(), p.getPersonType().name(), p.getDisplayName(),
                        p.getFirstName(), p.getLastName(), p.getDateOfBirth(), p.getNotes(), p.getExternalPersonRef()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<S8aRelationResponse> listRelations(Long s8aCaseId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);
        return relationRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(c.getId()).stream()
                .map(r -> new S8aRelationResponse(
                        r.getId(),
                        r.getFromPerson().getId(),
                        r.getToPerson().getId(),
                        r.getRelationType().name(),
                        r.getNotes()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<S8aCustodyRecordResponse> listCustodyRecords(Long s8aCaseId, Long childPersonId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        List<S8aCustodyRecord> records = (childPersonId == null)
                ? custodyRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(c.getId())
                : custodyRepo.findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(c.getId(), childPersonId);

        return records.stream()
                .map(cr -> new S8aCustodyRecordResponse(
                        cr.getId(),
                        cr.getChildPerson().getId(),
                        cr.getRightHolderPerson().getId(),
                        cr.getCustodyType().name(),
                        cr.getResidenceRight().name(),
                        cr.getValidFrom(),
                        cr.getValidTo(),
                        cr.getSourceTitle(),
                        cr.getSourceReference(),
                        cr.getNotes()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<S8aContactRestrictionResponse> listContactRestrictions(Long s8aCaseId, Long childPersonId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        List<S8aContactRestriction> records = (childPersonId == null)
                ? contactRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(c.getId())
                : contactRepo.findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(c.getId(), childPersonId);

        return records.stream()
                .map(r -> new S8aContactRestrictionResponse(
                        r.getId(),
                        r.getChildPerson().getId(),
                        r.getOtherPerson().getId(),
                        r.getRestrictionType().name(),
                        r.getReason(),
                        r.getValidFrom(),
                        r.getValidTo(),
                        r.getSourceTitle(),
                        r.getSourceReference()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<S8aOrderResponse> listOrders(Long s8aCaseId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        return orderRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(c.getId()).stream()
                .map(o -> new S8aOrderResponse(
                        o.getId(),
                        o.getOrderType(),
                        o.getTitle(),
                        o.getIssuedBy(),
                        o.getIssuedAt(),
                        o.getExpiresAt(),
                        o.getReference(),
                        o.getNotes()
                ))
                .toList();
    }

    // ---------- CREATE (deine bestehenden Methoden bleiben) ----------
    // Hinweis: Wenn du schon eine Version hast, kannst du diese Methoden 1:1 stehen lassen.
    // Ich lasse hier bewusst nur loadCaseScoped drin, damit du nicht doppelt pflegen musst.

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
}