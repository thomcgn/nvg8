package org.thomcgn.backend.faelle.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.thomcgn.backend.faelle.dto.FallResponse;
import org.thomcgn.backend.faelle.service.FallService;
import org.thomcgn.backend.pdf.service.PdfExportServiceV2;
import org.thomcgn.backend.pdf.service.PdfExportService;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/faelle")
public class FallPdfController {

    private final FallService fallService;
    private final PdfExportService pdf;
    private final PdfExportServiceV2 pdfV2;

    public FallPdfController(FallService fallService, PdfExportService pdf, PdfExportServiceV2 pdfV2) {
        this.fallService = fallService;
        this.pdf = pdf;
        this.pdfV2 = pdfV2;
    }

    @GetMapping(value="/{fallId}/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> export(@PathVariable Long fallId) {
        FallResponse fr = fallService.get(fallId);

        var notes = fr.notizen().stream()
                .map(n -> new PdfExportServiceV2.PdfNote(
                        n.createdAt() != null ? n.createdAt().toString() : "",
                        n.createdByDisplayName(),
                        n.typ(),
                        n.text()
                ))
                .toList();

        var data = new PdfExportServiceV2.PdfFallData(
                null, // aktenzeichen später
                fr.titel(),
                fr.status(),
                "Träger " + fr.traegerId(),          // Upgrade: Namen aus DB
                "Einrichtung " + fr.einrichtungOrgUnitId(),
                fr.teamOrgUnitId() != null ? ("Team " + fr.teamOrgUnitId()) : null,
                "", // createdAt optional; du kannst es aus fr oder Entity holen
                fr.createdByDisplayName(),
                fr.kurzbeschreibung(),
                notes
        );

        String watermark = "VERTRAULICH";
        byte[] bytes = pdfV2.buildFallaktePdf(data, watermark);

        String filename = "fall-" + fr.id() + ".pdf";
        ContentDisposition cd = ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}