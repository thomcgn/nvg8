package org.thomcgn.backend.shares.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.pdf.PdfExportService;
import org.thomcgn.backend.shares.dto.DownloadPackageResponse;
import org.thomcgn.backend.shares.service.CaseShareService;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/external/share")
public class CaseShareExternalPdfController {

    private final CaseShareService share;
    private final PdfExportService pdf;

    public CaseShareExternalPdfController(CaseShareService share, PdfExportService pdf) {
        this.share = share;
        this.pdf = pdf;
    }

    @GetMapping(value="/download.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@RequestParam String token) {
        DownloadPackageResponse pkg = share.downloadByToken(token);

        // PDF aus dem payloadJson (MVP: wir drucken JSON, Upgrade: JSON -> strukturierte Darstellung)
        String title = "Transferpaket Fall " + pkg.fallId() + " (Partner: " + pkg.partnerName() + ")";
        List<String> lines = List.of(
                "Expires: " + pkg.expiresAt(),
                "Downloads remaining: " + pkg.downloadsRemaining(),
                "",
                "Payload (JSON):",
                pkg.payloadJson()
        );

        byte[] bytes = pdf.buildFallPdf(title, lines);

        ContentDisposition cd = ContentDisposition.attachment()
                .filename(("transfer-" + pkg.packageId() + ".pdf"), StandardCharsets.UTF_8).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}