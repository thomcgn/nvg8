package org.thomcgn.backend.shares.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.shares.model.CaseShareRequest;
import org.thomcgn.backend.shares.model.ShareRequestStatus;
import org.thomcgn.backend.shares.repo.CaseShareRequestRepository;

@Service
public class ShareInboxService {

    private final CaseShareRequestRepository requestRepo;
    private final AccessControlService access;

    public ShareInboxService(CaseShareRequestRepository requestRepo, AccessControlService access) {
        this.requestRepo = requestRepo;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public Page<CaseShareRequest> inbox(String status, boolean mine, Pageable pageable) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (mine) {
            // "mine" -> nur meine Requests (ohne Traeger/Einh.-Filter)
            return requestRepo.findAllByRequestedBy(SecurityUtils.currentUserId(), pageable);
        }

        Long traegerId = SecurityUtils.currentTraegerIdRequired();   // ✅ statt access.activeTraegerIdRequired()
        Long einrichtungId = access.activeEinrichtungId();           // ✅ existiert bei dir

        if (einrichtungId == null) {
            return Page.empty(pageable);
        }

        ShareRequestStatus st = ShareRequestStatus.OPEN;
        if (status != null && !status.isBlank()) {
            try { st = ShareRequestStatus.valueOf(status.trim()); }
            catch (Exception e) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + status);
            }
        }

        return requestRepo.findAllOpenByOwningScope(traegerId, einrichtungId, st, pageable);
    }

    @Transactional(readOnly = true)
    public CaseShareRequest getDetail(Long id) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        CaseShareRequest r = requestRepo.findByIdWithRefs(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Share request not found"));

        access.requireAccessToEinrichtungObject(
                r.getFalleroeffnung().getTraeger().getId(),
                r.getFalleroeffnung().getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return r;
    }

    @Transactional(readOnly = true)
    public Page<CaseShareRequest> myRequests(Pageable pageable) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        return requestRepo.findAllByRequestedBy(SecurityUtils.currentUserId(), pageable);
    }
}