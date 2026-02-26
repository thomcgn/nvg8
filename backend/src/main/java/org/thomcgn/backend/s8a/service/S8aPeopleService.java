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
import org.thomcgn.backend.s8a.dto.*;
import org.thomcgn.backend.s8a.model.*;
import org.thomcgn.backend.s8a.repo.*;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class S8aPeopleService {

    private final S8aCaseRepository caseRepo;
    private final S8aCasePersonRepository personRepo;
    private final S8aCasePersonRelationRepository relationRepo;
    private final S8aCustodyRecordRepository custodyRepo;
    private final S8aContactRestrictionRepository contactRepo;
    private final S8aOrderRepository orderRepo;
    private final S8aEventRepository eventRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;

    public S8aPeopleService(S8aCaseRepository caseRepo,
                            S8aCasePersonRepository personRepo,
                            S8aCasePersonRelationRepository relationRepo,
                            S8aCustodyRecordRepository custodyRepo,
                            S8aContactRestrictionRepository contactRepo,
                            S8aOrderRepository orderRepo,
                            S8aEventRepository eventRepo,
                            UserRepository userRepo,
                            AccessControlService access,
                            AuditService audit) {
        this.caseRepo = caseRepo;
        this.personRepo = personRepo;
        this.relationRepo = relationRepo;
        this.custodyRepo = custodyRepo;
        this.contactRepo = contactRepo;
        this.orderRepo = orderRepo;
        this.eventRepo = eventRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
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

    /**
     * Default: Heads-only (aktueller Stand). Historie nur mit includeHistory=true.
     */
    @Transactional(readOnly = true)
    public List<S8aCustodyRecordResponse> listCustodyRecords(Long s8aCaseId, Long childPersonId, boolean includeHistory) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        List<S8aCustodyRecord> records = (childPersonId == null)
                ? custodyRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(c.getId())
                : custodyRepo.findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(c.getId(), childPersonId);

        List<S8aCustodyRecord> visible = includeHistory
                ? records
                : headsOnly(records, S8aCustodyRecord::getId, S8aCustodyRecord::getSupersedesId);

        return visible.stream()
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

    /**
     * Default: Heads-only (aktueller Stand). Historie nur mit includeHistory=true.
     */
    @Transactional(readOnly = true)
    public List<S8aContactRestrictionResponse> listContactRestrictions(Long s8aCaseId, Long childPersonId, boolean includeHistory) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        List<S8aContactRestriction> records = (childPersonId == null)
                ? contactRepo.findAllByS8aCaseIdOrderByCreatedAtAsc(c.getId())
                : contactRepo.findAllByS8aCaseIdAndChildPersonIdOrderByCreatedAtAsc(c.getId(), childPersonId);

        List<S8aContactRestriction> visible = includeHistory
                ? records
                : headsOnly(records, S8aContactRestriction::getId, S8aContactRestriction::getSupersedesId);

        return visible.stream()
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

    // ---------- HISTORY ----------

    @Transactional(readOnly = true)
    public List<S8aCustodyRecordResponse> getCustodyRecordHistory(Long s8aCaseId, Long recordId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        S8aCustodyRecord start = custodyRepo.findByIdAndS8aCaseId(recordId, c.getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "CustodyRecord not found"));

        List<S8aCustodyRecord> chain = buildCustodyChainBackwards(c.getId(), start);
        java.util.Collections.reverse(chain); // älteste -> neueste

        return chain.stream()
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
    public List<S8aContactRestrictionResponse> getContactRestrictionHistory(Long s8aCaseId, Long recordId) {
        S8aCase c = loadCaseScoped(s8aCaseId, true);

        S8aContactRestriction start = contactRepo.findByIdAndS8aCaseId(recordId, c.getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "ContactRestriction not found"));

        List<S8aContactRestriction> chain = buildRestrictionChainBackwards(c.getId(), start);
        java.util.Collections.reverse(chain); // älteste -> neueste

        return chain.stream()
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

    // ---------- CREATE (append-only) ----------

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
        if (child.getPersonType() != S8aPersonType.KIND) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "childPersonId must reference a KIND person");
        }

        S8aCustodyType ct;
        try { ct = S8aCustodyType.valueOf(req.custodyType().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown custodyType: " + req.custodyType()); }

        S8aResidenceDeterminationRight rr;
        try { rr = S8aResidenceDeterminationRight.valueOf(req.residenceRight().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown residenceRight: " + req.residenceRight()); }

        ensureNoCustodyOverlap(c.getId(), child.getId(), holder.getId(), null, req.validFrom(), req.validTo());

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
        cr.setSupersedesId(null);

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
        if (child.getPersonType() != S8aPersonType.KIND) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "childPersonId must reference a KIND person");
        }

        S8aContactRestrictionType rt;
        try { rt = S8aContactRestrictionType.valueOf(req.restrictionType().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown restrictionType: " + req.restrictionType()); }

        ensureNoRestrictionOverlap(c.getId(), child.getId(), other.getId(), null, req.validFrom(), req.validTo());

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
        r.setSupersedesId(null);

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

    // ---------- CORRECTIONS (revisionssicher: neuer Eintrag) ----------

    @Transactional
    public void correctCustodyRecord(Long s8aCaseId, Long originalId, CreateS8aCustodyRecordCorrectionRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        if (req.correctionReason() == null || req.correctionReason().isBlank()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "correctionReason is required");
        }

        S8aCustodyRecord original = custodyRepo.findByIdAndS8aCaseId(originalId, c.getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "CustodyRecord not found"));

        // Nur HEAD darf korrigiert werden (sonst Forks)
        if (!custodyRepo.findAllByS8aCaseIdAndSupersedesIdOrderByCreatedAtAsc(c.getId(), original.getId()).isEmpty()) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Only HEAD records can be corrected (record already superseded)");
        }

        S8aCustodyType ct;
        try { ct = S8aCustodyType.valueOf(req.custodyType().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown custodyType: " + req.custodyType()); }

        S8aResidenceDeterminationRight rr;
        try { rr = S8aResidenceDeterminationRight.valueOf(req.residenceRight().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown residenceRight: " + req.residenceRight()); }

        ensureNoCustodyOverlap(
                c.getId(),
                original.getChildPerson().getId(),
                original.getRightHolderPerson().getId(),
                null,
                req.validFrom(),
                req.validTo()
        );

        S8aCustodyRecord cr = new S8aCustodyRecord();
        cr.setS8aCase(c);
        cr.setChildPerson(original.getChildPerson());
        cr.setRightHolderPerson(original.getRightHolderPerson());
        cr.setCustodyType(ct);
        cr.setResidenceRight(rr);
        cr.setValidFrom(req.validFrom());
        cr.setValidTo(req.validTo());
        cr.setSourceTitle(req.sourceTitle());
        cr.setSourceReference(req.sourceReference());
        cr.setNotes(req.notes());
        cr.setSupersedesId(original.getId());

        if (req.sourceOrderId() != null) {
            S8aOrder o = orderRepo.findById(req.sourceOrderId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Order not found: " + req.sourceOrderId()));
            if (!o.getS8aCase().getId().equals(c.getId())) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Order does not belong to this s8aCase");
            }
            cr.setSourceOrder(o);
        }

        S8aCustodyRecord saved = custodyRepo.save(cr);

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.PEOPLE_RECORD_CORRECTED);
        ev.setText("Korrektur Sorgerecht/Aufenthalt: #" + original.getId() + " → #" + saved.getId()
                + " | Grund: " + req.correctionReason().trim());
        ev.setPayloadJson("{\"type\":\"CUSTODY\",\"originalId\":" + original.getId() + ",\"newId\":" + saved.getId() + "}");
        ev.setCreatedBy(actor);
        eventRepo.save(ev);

        audit.log(
                AuditEventAction.S8A_PEOPLE_RECORD_CORRECTED,
                "S8aCustodyRecord",
                saved.getId(),
                c.getEinrichtung().getId(),
                "Corrected custody record originalId=" + original.getId() + " reason=" + req.correctionReason().trim()
        );
    }

    @Transactional
    public void correctContactRestriction(Long s8aCaseId, Long originalId, CreateS8aContactRestrictionCorrectionRequest req) {
        S8aCase c = loadCaseScoped(s8aCaseId, false);
        ensureCaseWritable(c);

        if (req.correctionReason() == null || req.correctionReason().isBlank()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "correctionReason is required");
        }

        S8aContactRestriction original = contactRepo.findByIdAndS8aCaseId(originalId, c.getId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "ContactRestriction not found"));

        // Nur HEAD darf korrigiert werden (sonst Forks)
        if (!contactRepo.findAllByS8aCaseIdAndSupersedesIdOrderByCreatedAtAsc(c.getId(), original.getId()).isEmpty()) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Only HEAD records can be corrected (record already superseded)");
        }

        S8aContactRestrictionType rt;
        try { rt = S8aContactRestrictionType.valueOf(req.restrictionType().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown restrictionType: " + req.restrictionType()); }

        ensureNoRestrictionOverlap(
                c.getId(),
                original.getChildPerson().getId(),
                original.getOtherPerson().getId(),
                null,
                req.validFrom(),
                req.validTo()
        );

        S8aContactRestriction r = new S8aContactRestriction();
        r.setS8aCase(c);
        r.setChildPerson(original.getChildPerson());
        r.setOtherPerson(original.getOtherPerson());
        r.setRestrictionType(rt);
        r.setReason(req.reason());
        r.setValidFrom(req.validFrom());
        r.setValidTo(req.validTo());
        r.setSourceTitle(req.sourceTitle());
        r.setSourceReference(req.sourceReference());
        r.setSupersedesId(original.getId());

        if (req.sourceOrderId() != null) {
            S8aOrder o = orderRepo.findById(req.sourceOrderId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Order not found: " + req.sourceOrderId()));
            if (!o.getS8aCase().getId().equals(c.getId())) {
                throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Order does not belong to this s8aCase");
            }
            r.setSourceOrder(o);
        }

        S8aContactRestriction saved = contactRepo.save(r);

        User actor = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        S8aEvent ev = new S8aEvent();
        ev.setS8aCase(c);
        ev.setType(S8aEventType.PEOPLE_RECORD_CORRECTED);
        ev.setText("Korrektur Kontaktregelung: #" + original.getId() + " → #" + saved.getId()
                + " | Grund: " + req.correctionReason().trim());
        ev.setPayloadJson("{\"type\":\"CONTACT_RESTRICTION\",\"originalId\":" + original.getId() + ",\"newId\":" + saved.getId() + "}");
        ev.setCreatedBy(actor);
        eventRepo.save(ev);

        audit.log(
                AuditEventAction.S8A_PEOPLE_RECORD_CORRECTED,
                "S8aContactRestriction",
                saved.getId(),
                c.getEinrichtung().getId(),
                "Corrected contact restriction originalId=" + original.getId() + " reason=" + req.correctionReason().trim()
        );
    }

    // ---------- generic heads-only helper (avoids type-erasure clashes) ----------

    private <T> List<T> headsOnly(List<T> records,
                                  java.util.function.Function<T, Long> idExtractor,
                                  java.util.function.Function<T, Long> supersedesExtractor) {

        if (records == null || records.isEmpty()) return List.of();

        java.util.Set<Long> supersededIds = new java.util.HashSet<>();
        for (T r : records) {
            Long sid = supersedesExtractor.apply(r);
            if (sid != null) supersededIds.add(sid);
        }

        return records.stream()
                .filter(r -> !supersededIds.contains(idExtractor.apply(r)))
                .toList();
    }

    // ---------- history helpers (fixed: lambda capture with effectively-final var) ----------

    private List<S8aCustodyRecord> buildCustodyChainBackwards(Long caseId, S8aCustodyRecord start) {
        java.util.ArrayList<S8aCustodyRecord> chain = new java.util.ArrayList<>();
        chain.add(start);

        Long prevId = start.getSupersedesId();
        while (prevId != null) {
            final Long currentId = prevId;

            S8aCustodyRecord prev = custodyRepo.findByIdAndS8aCaseId(currentId, caseId)
                    .orElseThrow(() -> DomainException.notFound(
                            ErrorCode.NOT_FOUND,
                            "Broken custody history chain at id=" + currentId
                    ));

            chain.add(prev);
            prevId = prev.getSupersedesId();
        }

        return chain;
    }

    private List<S8aContactRestriction> buildRestrictionChainBackwards(Long caseId, S8aContactRestriction start) {
        java.util.ArrayList<S8aContactRestriction> chain = new java.util.ArrayList<>();
        chain.add(start);

        Long prevId = start.getSupersedesId();
        while (prevId != null) {
            final Long currentId = prevId;

            S8aContactRestriction prev = contactRepo.findByIdAndS8aCaseId(currentId, caseId)
                    .orElseThrow(() -> DomainException.notFound(
                            ErrorCode.NOT_FOUND,
                            "Broken restriction history chain at id=" + currentId
                    ));

            chain.add(prev);
            prevId = prev.getSupersedesId();
        }

        return chain;
    }

    // ---------- overlap checks (unbounded ranges supported) ----------

    private void ensureNoCustodyOverlap(Long caseId,
                                        Long childId,
                                        Long holderId,
                                        Long excludeId,
                                        String newFrom,
                                        String newTo) {
        LocalDate from = parseIsoDateOrNull(newFrom);
        LocalDate to = parseIsoDateOrNull(newTo);

        List<S8aCustodyRecord> existing =
                custodyRepo.findAllByS8aCaseIdAndChildPersonIdAndRightHolderPersonIdOrderByCreatedAtDesc(caseId, childId, holderId);

        for (S8aCustodyRecord e : existing) {
            if (excludeId != null && excludeId.equals(e.getId())) continue;

            if (rangesOverlap(from, to, parseIsoDateOrNull(e.getValidFrom()), parseIsoDateOrNull(e.getValidTo()))) {
                throw DomainException.conflict(ErrorCode.CONFLICT,
                        "CustodyRecord date range overlaps with existing record id=" + e.getId());
            }
        }
    }

    private void ensureNoRestrictionOverlap(Long caseId,
                                            Long childId,
                                            Long otherId,
                                            Long excludeId,
                                            String newFrom,
                                            String newTo) {
        LocalDate from = parseIsoDateOrNull(newFrom);
        LocalDate to = parseIsoDateOrNull(newTo);

        List<S8aContactRestriction> existing =
                contactRepo.findAllByS8aCaseIdAndChildPersonIdAndOtherPersonIdOrderByCreatedAtDesc(caseId, childId, otherId);

        for (S8aContactRestriction e : existing) {
            if (excludeId != null && excludeId.equals(e.getId())) continue;

            if (rangesOverlap(from, to, parseIsoDateOrNull(e.getValidFrom()), parseIsoDateOrNull(e.getValidTo()))) {
                throw DomainException.conflict(ErrorCode.CONFLICT,
                        "ContactRestriction date range overlaps with existing record id=" + e.getId());
            }
        }
    }

    private boolean rangesOverlap(LocalDate aFrom, LocalDate aTo, LocalDate bFrom, LocalDate bTo) {
        LocalDate aStart = aFrom != null ? aFrom : LocalDate.MIN;
        LocalDate aEnd = aTo != null ? aTo : LocalDate.MAX;
        LocalDate bStart = bFrom != null ? bFrom : LocalDate.MIN;
        LocalDate bEnd = bTo != null ? bTo : LocalDate.MAX;
        return !aStart.isAfter(bEnd) && !bStart.isAfter(aEnd);
    }

    private LocalDate parseIsoDateOrNull(String s) {
        if (s == null || s.isBlank()) return null;
        try { return LocalDate.parse(s.trim()); } catch (Exception ignored) { return null; }
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