package org.thomcgn.backend.orgunits.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.orgunits.dto.CreateOrgUnitRequest;
import org.thomcgn.backend.orgunits.dto.OrgUnitNodeDto;
import org.thomcgn.backend.orgunits.dto.UpdateOrgUnitRequest;
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

    // Bug-Fix: früher war @PreAuthorize("@perm.canManageOrgUnit(#orgUnitId)") — #orgUnitId existiert
    // nicht als Parameter und wird zu null aufgelöst → immer 403/404.
    // Die granulare Prüfung passiert im Service via adminGuard.requireCanManageOrgUnit(req.parentId()).
    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PostMapping
    public ResponseEntity<OrgUnitNodeDto> create(@Valid @RequestBody CreateOrgUnitRequest req) {
        return ResponseEntity.ok(orgUnitService.create(req));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<OrgUnitNodeDto> update(@PathVariable Long id,
                                                  @Valid @RequestBody UpdateOrgUnitRequest req) {
        return ResponseEntity.ok(orgUnitService.update(id, req));
    }

    @PreAuthorize("hasRole('TRAEGER_ADMIN') or hasRole('EINRICHTUNG_ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> disable(@PathVariable Long id) {
        orgUnitService.disable(id);
        return ResponseEntity.noContent().build();
    }
}
