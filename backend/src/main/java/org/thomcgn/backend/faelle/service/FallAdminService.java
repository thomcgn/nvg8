package org.thomcgn.backend.faelle.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.faelle.dto.*;
import org.thomcgn.backend.faelle.model.Fall;
import org.thomcgn.backend.faelle.model.FallStatus;
import org.thomcgn.backend.faelle.repo.FallRepository;

import java.util.List;
import java.util.Set;

@Service
public class FallAdminService {

    private final FallRepository fallRepository;
    private final AccessControlService access;

    public FallAdminService(FallRepository fallRepository, AccessControlService access) {
        this.fallRepository = fallRepository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public FallListResponse listAll(String status, String q, Long einrichtungOrgUnitId, Pageable pageable) {
        access.requireAny(Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        FallStatus st = null;
        if (status != null && !status.isBlank()) {
            try { st = FallStatus.valueOf(status.trim()); }
            catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + status); }
        }

        String query = (q == null || q.isBlank()) ? null : q.trim();

        Set<Long> einrichtungen = (einrichtungOrgUnitId != null)
                ? Set.of(einrichtungOrgUnitId)
                : null;

        Page<Fall> page = fallRepository.searchTraegerWide(traegerId, einrichtungen, st, query, pageable);

        List<FallListItemResponse> items = page.getContent().stream()
                .map(f -> new FallListItemResponse(
                        f.getId(),
                        f.getStatus().name(),
                        f.getTitel(),
                        f.getEinrichtungOrgUnit().getId(),
                        f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                        f.getCreatedBy().getDisplayName(),
                        f.getCreatedAt()
                ))
                .toList();

        return new FallListResponse(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }
}