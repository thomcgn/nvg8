package org.thomcgn.backend.orgunits.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.orgunits.dto.CreateOrgUnitRequest;
import org.thomcgn.backend.orgunits.dto.OrgUnitNodeDto;
import org.thomcgn.backend.orgunits.service.OrgUnitService;

@RestController
@RequestMapping("/org-units")
public class OrgUnitController {

    private final OrgUnitService orgUnitService;

    public OrgUnitController(OrgUnitService orgUnitService) {
        this.orgUnitService = orgUnitService;
    }

    @GetMapping("/tree")
    public ResponseEntity<OrgUnitNodeDto> tree() {
        return ResponseEntity.ok(orgUnitService.getTreeForCurrentTraeger());
    }

    //@PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PreAuthorize("@perm.canManageOrgUnit(#orgUnitId)")
    @PostMapping
    public ResponseEntity<OrgUnitNodeDto> create(@Valid @RequestBody CreateOrgUnitRequest req) {
        return ResponseEntity.ok(orgUnitService.create(req));
    }
}