package org.thomcgn.backend.shares.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.thomcgn.backend.pdf.service.PdfExportServiceV2;
import org.thomcgn.backend.shares.dto.DownloadPackageResponse;
import org.thomcgn.backend.shares.service.CaseShareService;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/external/share")
public class CaseShareExternalPdfController {

    private final CaseShareService share;
    private final PdfExportServiceV2 pdf;
    private final ObjectMapper mapper = new ObjectMapper();

    public CaseShareExternalPdfController(CaseShareService share,
                                          PdfExportServiceV2 pdf) {
        this.share = share;
        this.pdf = pdf;
    }

    @GetMapping(value="/download.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadPdf(@RequestParam String token) {

        DownloadPackageResponse pkg = share.downloadByToken(token);

        JsonNode root;
        try {
            root = mapper.readTree(pkg.payloadJson());
        } catch (Exception e) {
            throw new IllegalStateException("Invalid snapshot payload", e);
        }

        List<PdfExportServiceV2.PdfNote> notes = new ArrayList<>();

        if (root.has("notes")) {
            for (JsonNode n : root.get("notes")) {
                notes.add(new PdfExportServiceV2.PdfNote(
                        n.path("createdAt").asText(""),
                        n.path("createdBy").asText(""),
                        n.path("typ").asText(""),
                        n.path("text").asText("")
                ));
            }
        }

        PdfExportServiceV2.PdfFallData data =
                new PdfExportServiceV2.PdfFallData(
                        "Transfer-" + pkg.packageId(),
                        root.path("titel").asText(""),
                        root.path("status").asText(""),
                        "—", // Träger nicht im Snapshot? optional ergänzen
                        "—", // Einrichtung optional ergänzen
                        null,
                        root.path("createdAt").asText(""),
                        "",
                        root.path("kurzbeschreibung").asText(""),
                        notes
                );

        String watermark =
                "Zweckbindung • Partner: " + pkg.partnerName();

        byte[] bytes = pdf.buildFallaktePdf(data, watermark);

        String filename = "transfer-" + pkg.packageId() + ".pdf";

        ContentDisposition cd = ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, cd.toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(bytes);
    }
}