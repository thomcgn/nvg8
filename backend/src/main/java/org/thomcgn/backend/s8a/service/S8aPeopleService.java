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
                        cr.getSourceOrder() != null ? cr.getSourceOrder().getId() : null,
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
                        r.getSourceReference(),
                        r.getSourceOrder() != null ? r.getSourceOrder().getId() : null
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

    // ---------- CREATE ----------

    @Transactional
    public S8aCasePersonResponse createPerson(Long s8aCaseId, CreateS8aCasePersonRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        S8aPersonType type;
        try { type = S8aPersonType.valueOf(req.personType().trim()); }
        catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown personType: " + req.personType());
        }

        S8aCasePerson p = new S8aCasePerson();
        p.setS8aCase(c);
        p.setPersonType(type);
        p.setDisplayName(req.displayName());
        p.setFirstName(req.firstName());
        p.setLastName(req.lastName());
        p.setDateOfBirth(req.dateOfBirth());
        p.setNotes(req.notes());
        p.setExternalPersonRef(req.externalPersonRef());

        S8aCasePerson saved = personRepo.save(p);

        return new S8aCasePersonResponse(
                saved.getId(), c.getId(), saved.getPersonType().name(), saved.getDisplayName(),
                saved.getFirstName(), saved.getLastName(), saved.getDateOfBirth(), saved.getNotes(), saved.getExternalPersonRef()
        );
    }

    @Transactional
    public S8aRelationResponse createRelation(Long s8aCaseId, CreateS8aRelationRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        S8aRelationshipType rt;
        try { rt = S8aRelationshipType.valueOf(req.relationType().trim()); }
        catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown relationType: " + req.relationType());
        }

        S8aCasePerson from = personRepo.findById(req.fromPersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "fromPerson not found"));
        S8aCasePerson to = personRepo.findById(req.toPersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "toPerson not found"));

        if (!from.getS8aCase().getId().equals(c.getId()) || !to.getS8aCase().getId().equals(c.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Persons must belong to same s8aCase");
        }

        S8aCasePersonRelation rel = new S8aCasePersonRelation();
        rel.setS8aCase(c);
        rel.setFromPerson(from);
        rel.setToPerson(to);
        rel.setRelationType(rt);
        rel.setNotes(req.notes());

        S8aCasePersonRelation saved = relationRepo.save(rel);

        return new S8aRelationResponse(saved.getId(), from.getId(), to.getId(), saved.getRelationType().name(), saved.getNotes());
    }

    @Transactional
    public void addCustodyRecord(Long s8aCaseId, CreateS8aCustodyRecordRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        S8aCasePerson child = personRepo.findById(req.childPersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "childPerson not found"));
        S8aCasePerson holder = personRepo.findById(req.rightHolderPersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "rightHolderPerson not found"));

        if (!child.getS8aCase().getId().equals(c.getId()) || !holder.getS8aCase().getId().equals(c.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Persons must belong to same s8aCase");
        }

        S8aCustodyType ct;
        try { ct = S8aCustodyType.valueOf(req.custodyType().trim()); }
        catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown custodyType: " + req.custodyType());
        }

        S8aResidenceDeterminationRight rr;
        try { rr = S8aResidenceDeterminationRight.valueOf(req.residenceRight().trim()); }
        catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown residenceRight: " + req.residenceRight());
        }

        S8aCustodyRecord cr = new S8aCustodyRecord();
        cr.setS8aCase(c);
        cr.setChildPerson(child);
        cr.setRightHolderPerson(holder);
        cr.setCustodyType(ct);
        cr.setResidenceRight(rr);
        cr.setValidFrom(req.validFrom());
        cr.setValidTo(req.validTo());
        cr.setSourceTitle(req.sourceTitle());
        cr.setSourceReference(req.sourceReference());
        cr.setNotes(req.notes());

        if (req.sourceOrderId() != null) {
            S8aOrder o = orderRepo.findById(req.sourceOrderId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Order not found: " + req.sourceOrderId()));
            if (!o.getS8aCase().getId().equals(c.getId())) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Order does not belong to this s8aCase");
            }
            cr.setSourceOrder(o);
        }

        custodyRepo.save(cr);
    }

    @Transactional
    public void addContactRestriction(Long s8aCaseId, CreateS8aContactRestrictionRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        S8aCasePerson child = personRepo.findById(req.childPersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "childPerson not found"));
        S8aCasePerson other = personRepo.findById(req.otherPersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "otherPerson not found"));

        if (!child.getS8aCase().getId().equals(c.getId()) || !other.getS8aCase().getId().equals(c.getId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Persons must belong to same s8aCase");
        }

        S8aContactRestrictionType rt;
        try { rt = S8aContactRestrictionType.valueOf(req.restrictionType().trim()); }
        catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown restrictionType: " + req.restrictionType());
        }

        S8aContactRestriction r = new S8aContactRestriction();
        r.setS8aCase(c);
        r.setChildPerson(child);
        r.setOtherPerson(other);
        r.setRestrictionType(rt);
        r.setReason(req.reason());
        r.setValidFrom(req.validFrom());
        r.setValidTo(req.validTo());
        r.setSourceTitle(req.sourceTitle());
        r.setSourceReference(req.sourceReference());

        if (req.sourceOrderId() != null) {
            S8aOrder o = orderRepo.findById(req.sourceOrderId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Order not found: " + req.sourceOrderId()));
            if (!o.getS8aCase().getId().equals(c.getId())) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Order does not belong to this s8aCase");
            }
            r.setSourceOrder(o);
        }

        contactRepo.save(r);
    }

    @Transactional
    public void addOrder(Long s8aCaseId, CreateS8aOrderRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        S8aOrder o = new S8aOrder();
        o.setS8aCase(c);
        o.setOrderType(req.orderType());
        o.setTitle(req.title());
        o.setIssuedBy(req.issuedBy());
        o.setIssuedAt(req.issuedAt());
        o.setExpiresAt(req.expiresAt());
        o.setReference(req.reference());
        o.setNotes(req.notes());

        orderRepo.save(o);
    }

    // ---------- helpers ----------

    private void ensureCaseWritable(S8aCase c) {
        if (c.getStatus() == S8aStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "S8a case is closed (read-only).");
        }
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
}