package org.thomcgn.backend.faelle.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.faelle.dto.FallListResponse;
import org.thomcgn.backend.faelle.service.FallAdminService;

@RestController
@RequestMapping("/faelle")
public class FallAdminController {

    private final FallAdminService fallAdminService;

    public FallAdminController(FallAdminService fallAdminService) {
        this.fallAdminService = fallAdminService;
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN')")
    @GetMapping("/all")
    public ResponseEntity<FallListResponse> listAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Long einrichtungOrgUnitId, // optional filter
            @PageableDefault(size = 50) Pageable pageable
    ) {
        return ResponseEntity.ok(fallAdminService.listAll(status, q, einrichtungOrgUnitId, pageable));
    }
}