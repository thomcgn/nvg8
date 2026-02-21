package org.thomcgn.backend.shares.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.shares.dto.DownloadPackageResponse;
import org.thomcgn.backend.shares.service.CaseShareService;

@RestController
@RequestMapping("/external/share")
public class CaseShareExternalController {

    private final CaseShareService service;

    public CaseShareExternalController(CaseShareService service) {
        this.service = service;
    }

    // Public (permitAll) – token is the auth
    @GetMapping("/download")
    public ResponseEntity<DownloadPackageResponse> download(@RequestParam String token) {
        return ResponseEntity.ok(service.downloadByToken(token));
    }
}