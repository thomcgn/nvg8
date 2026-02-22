package org.thomcgn.backend.falloeffnungen.service;

import org.springframework.stereotype.Service;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;
import org.thomcgn.backend.pdf.service.PdfExportServiceV2;

@Service
public class FalleroeffnungPdfMapperService {

    private final FalleroeffnungNotizRepository notizRepo;

    public FalleroeffnungPdfMapperService(FalleroeffnungNotizRepository notizRepo) {
        this.notizRepo = notizRepo;
    }

    public PdfExportServiceV2.PdfFallData toPdfData(Falleroeffnung f) {
        var notizen = notizRepo.findAllByFalleroeffnungIdOrderByCreatedAtAsc(f.getId()).stream()
                .map(n -> new PdfExportServiceV2.PdfNote(
                        n.getCreatedAt() != null ? n.getCreatedAt().toString() : "",
                        n.getCreatedBy() != null ? n.getCreatedBy().getDisplayName() : "",
                        n.getTyp(),
                        n.getText()
                ))
                .toList();

        String traegerName = f.getTraeger() != null ? safeName(f.getTraeger().getName()) : "";
        String einrichtungName = f.getEinrichtungOrgUnit() != null ? safeName(f.getEinrichtungOrgUnit().getName()) : "";
        String teamName = f.getTeamOrgUnit() != null ? safeName(f.getTeamOrgUnit().getName()) : null;

        String createdAt = f.getCreatedAt() != null ? f.getCreatedAt().toString() : "";
        String createdBy = f.getCreatedBy() != null ? f.getCreatedBy().getDisplayName() : "";

        return new PdfExportServiceV2.PdfFallData(
                f.getAktenzeichen(),
                safeName(f.getTitel()),
                f.getStatus() != null ? f.getStatus().name() : "",
                traegerName,
                einrichtungName,
                teamName,
                createdAt,
                createdBy,
                f.getKurzbeschreibung(),
                notizen
        );
    }

    private String safeName(String s) {
        if (s == null) return "";
        return s.replace("\r", " ").replace("\n", " ").trim();
    }
}