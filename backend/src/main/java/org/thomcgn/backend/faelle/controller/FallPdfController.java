package org.thomcgn.backend.faelle.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.faelle.dto.FallResponse;
import org.thomcgn.backend.faelle.service.FallService;
import org.thomcgn.backend.pdf.PdfExportService;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/faelle")
public class FallPdfController {

    private final FallService fallService;
    private final PdfExportService pdf;

    public FallPdfController(FallService fallService, PdfExportService pdf) {
        this.fallService = fallService;
        this.pdf = pdf;
    }

    @GetMapping(value="/{fallId}/export.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> export(@PathVariable Long fallId) {
        FallResponse fr = fallService.get(fallId); // nutzt bereits Zugriffskontrolle

        List<String> lines = new ArrayList<>();
        lines.add("Status: " + fr.status());
        lines.add("TraegerId: " + fr.traegerId());
        lines.add("EinrichtungOrgUnitId: " + fr.einrichtungOrgUnitId());
        lines.add("TeamOrgUnitId: " + (fr.teamOrgUnitId() != null ? fr.teamOrgUnitId() : "-"));
        lines.add("Erstellt von: " + fr.createdByDisplayName());
        lines.add("");
        lines.add("Kurzbeschreibung:");
        lines.add(fr.kurzbeschreibung() != null ? fr.kurzbeschreibung() : "-");
        lines.add("");
        lines.add("Notizen:");

        fr.notizen().forEach(n -> {
            lines.add("[" + n.createdAt() + "] (" + (n.typ() != null ? n.typ() : "-") + ") " + n.createdByDisplayName());
            lines.add(n.text());
            lines.add("");
        });

        byte[] bytes = pdf.buildFallPdf("Fallakte: " + fr.titel(), lines);

        String filename = ("fall-" + fr.id() + ".pdf");
        ContentDisposition cd = ContentDisposition.attachment().filename(filename, StandardCharsets.UTF_8).build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}