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
import org.thomcgn.backend.shares.dto.*;
import org.thomcgn.backend.shares.model.CaseShareRequest;
import org.thomcgn.backend.shares.model.ShareRequestStatus;
import org.thomcgn.backend.shares.repo.CaseShareRequestRepository;

import java.util.List;

@Service
public class ShareInboxService {

    private final CaseShareRequestRepository requestRepo;
    private final AccessControlService access;

    public ShareInboxService(CaseShareRequestRepository requestRepo, AccessControlService access) {
        this.requestRepo = requestRepo;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public ShareRequestListResponse inbox(String status, boolean traegerWide, Pageable pageable) {
        access.requireAny(Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        ShareRequestStatus st = ShareRequestStatus.OPEN;

        if (status != null && !status.isBlank()) {
            try { st = ShareRequestStatus.valueOf(status.trim()); }
            catch (Exception e) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + status);
            }
        }

        Page<CaseShareRequest> page;

        if (traegerWide) {
            // nur TRAEGER_ADMIN darf das
            access.requireAny(Role.TRAEGER_ADMIN);
            page = requestRepo.inboxTraegerWide(traegerId, st, pageable);
        } else {
            Long einrichtungId = access.activeEinrichtungId();
            if (einrichtungId == null) {
                return new ShareRequestListResponse(List.of(), pageable.getPageNumber(), pageable.getPageSize(), 0);
            }
            page = requestRepo.inboxForEinrichtung(traegerId, einrichtungId, st, pageable);
        }

        var items = page.getContent().stream()
                .map(r -> new ShareRequestListItemResponse(
                        r.getId(),
                        r.getStatus().name(),
                        r.getFall().getId(),
                        r.getPartner().getName(),
                        r.getLegalBasisType().name(),
                        r.getPurpose(),
                        r.getCreatedAt()
                ))
                .toList();

        return new ShareRequestListResponse(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public ShareRequestListResponse myRequests(Pageable pageable) {
        Long userId = SecurityUtils.currentUserId();

        Page<CaseShareRequest> page =
                requestRepo.findMyRequests(userId, pageable);

        var items = page.getContent().stream()
                .map(r -> new ShareRequestListItemResponse(
                        r.getId(),
                        r.getStatus().name(),
                        r.getFall().getId(),
                        r.getPartner().getName(),
                        r.getLegalBasisType().name(),
                        r.getPurpose(),
                        r.getCreatedAt()
                ))
                .toList();

        return new ShareRequestListResponse(
                items,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements()
        );
    }

    @Transactional(readOnly = true)
    public ShareRequestDetailResponse getDetail(Long requestId) {
        access.requireAny(Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        CaseShareRequest r = requestRepo.findByIdWithDetailRefs(requestId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Share request not found"));

        // Sicherstellen: nur owning einrichtung im scope (oder TraegerAdmin)
        access.requireAccessToEinrichtungObject(
                r.getOwningTraeger().getId(),
                r.getOwningEinrichtung().getId(),
                Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return new ShareRequestDetailResponse(
                r.getId(),
                r.getStatus().name(),
                r.getFall().getId(),
                r.getPartner().getId(),
                r.getPartner().getName(),
                r.getLegalBasisType().name(),
                r.getPurpose(),
                r.getNotesFrom(),
                r.getNotesTo(),
                r.getRequestedBy().getDisplayName(),
                r.getCreatedAt(),
                r.getDecisionReason(),
                r.getDecidedBy() != null ? r.getDecidedBy().getDisplayName() : null,
                r.getDecidedAt()
        );
    }
}