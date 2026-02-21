package org.thomcgn.backend.audit.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.audit.dto.AuditEventResponse;
import org.thomcgn.backend.audit.repo.AuditEventRepository;
import org.thomcgn.backend.common.security.SecurityUtils;

@RestController
@RequestMapping("/audit")
public class AuditController {

    private final AuditEventRepository repo;

    public AuditController(AuditEventRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<?> list(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) Long entityId,
            @PageableDefault(size = 50) Pageable pageable
    ) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        var page = repo.search(traegerId, entityType, entityId, pageable);

        var resp = page.map(a -> new AuditEventResponse(
                a.getId(),
                a.getAction().name(),
                a.getEntityType(),
                a.getEntityId(),
                a.getUser().getDisplayName(),
                a.getOrgUnit() != null ? a.getOrgUnit().getId() : null,
                a.getMessage(),
                a.getCreatedAt()
        ));

        return ResponseEntity.ok(resp);
    }
}