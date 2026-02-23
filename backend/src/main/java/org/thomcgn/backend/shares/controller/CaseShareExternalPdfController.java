package org.thomcgn.backend.shares.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.shares.dto.DownloadPackageResponse;
import org.thomcgn.backend.shares.service.CaseShareService;

@RestController
@RequestMapping("/external/share")
public class CaseShareExternalPdfController {

    private final CaseShareService shareService;

    public CaseShareExternalPdfController(CaseShareService shareService) {
        this.shareService = shareService;
    }

    @GetMapping("/download/pdf")
    public ResponseEntity<String> downloadJson(@RequestParam String token) {
        DownloadPackageResponse pkg = shareService.downloadByToken(token);

        // Minimal: JSON zurückgeben (PDF bauen wir danach sauber aus)
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(pkg.payloadJson());
    }
}