package org.thomcgn.backend.falloeffnungen.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.service.FalleroeffnungPdfMapperService;
import org.thomcgn.backend.pdf.service.PdfExportServiceV2;

@RestController
@RequestMapping("/falloeffnungen")
public class FalleroeffnungPdfController {

    private final FalleroeffnungRepository repo;
    private final FalleroeffnungPdfMapperService mapper;
    private final PdfExportServiceV2 pdf;
    private final AccessControlService access;

    public FalleroeffnungPdfController(FalleroeffnungRepository repo,
                                       FalleroeffnungPdfMapperService mapper,
                                       PdfExportServiceV2 pdf,
                                       AccessControlService access) {
        this.repo = repo;
        this.mapper = mapper;
        this.pdf = pdf;
        this.access = access;
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id,
                                            @RequestParam(defaultValue = "INTERN") String watermark) {

        var f = repo.findByIdWithRefs(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        byte[] bytes = pdf.buildFallaktePdf(mapper.toPdfData(f), watermark);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline()
                .filename("falloeffnung_" + f.getAktenzeichen() + ".pdf")
                .build());

        return new ResponseEntity<>(bytes, headers, HttpStatus.OK);
    }
}