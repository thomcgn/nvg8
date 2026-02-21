package org.thomcgn.backend.shares.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.shares.dto.*;
import org.thomcgn.backend.shares.service.CaseShareService;

@RestController
@RequestMapping("/shares")
public class CaseShareInternalController {

    private final CaseShareService service;

    public CaseShareInternalController(CaseShareService service) {
        this.service = service;
    }

    // Mitarbeiter stellt Anfrage (im Kontext der fall-owning Einrichtung)
    @PostMapping("/requests")
    public ResponseEntity<CreateShareRequestResponse> create(@Valid @RequestBody CreateShareRequestRequest req) {
        return ResponseEntity.ok(service.createRequest(req));
    }

    // Leitung genehmigt
    @PreAuthorize("hasRole('EINRICHTUNG_ADMIN') or hasRole('TRAEGER_ADMIN')")
    @PostMapping("/requests/{requestId}/approve")
    public ResponseEntity<ApproveShareRequestResponse> approve(
            @PathVariable Long requestId,
            @Valid @RequestBody ApproveShareRequestRequest req
    ) {
        return ResponseEntity.ok(service.approve(requestId, req));
    }

    // Leitung lehnt ab
    @PreAuthorize("hasRole('EINRICHTUNG_ADMIN') or hasRole('TRAEGER_ADMIN')")
    @PostMapping("/requests/{requestId}/reject")
    public ResponseEntity<Void> reject(
            @PathVariable Long requestId,
            @Valid @RequestBody RejectShareRequestRequest req
    ) {
        service.reject(requestId, req);
        return ResponseEntity.noContent().build();
    }
}