package org.thomcgn.backend.dji.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.dji.catalog.DjiItem;
import org.thomcgn.backend.dji.catalog.DjiKatalog;
import org.thomcgn.backend.dji.dto.*;
import org.thomcgn.backend.dji.model.DjiAssessment;
import org.thomcgn.backend.dji.model.DjiFormTyp;
import org.thomcgn.backend.dji.model.DjiPosition;
import org.thomcgn.backend.dji.repo.DjiAssessmentRepository;
import org.thomcgn.backend.dji.repo.DjiPositionRepository;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;
import java.util.Map;

@Service
public class DjiService {

    private final DjiAssessmentRepository assessmentRepo;
    private final DjiPositionRepository positionRepo;
    private final FalleroeffnungRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    public DjiService(
            DjiAssessmentRepository assessmentRepo,
            DjiPositionRepository positionRepo,
            FalleroeffnungRepository fallRepo,
            UserRepository userRepo,
            AccessControlService access) {
        this.assessmentRepo = assessmentRepo;
        this.positionRepo   = positionRepo;
        this.fallRepo       = fallRepo;
        this.userRepo       = userRepo;
        this.access         = access;
    }

    // ─── Formtypen ──────────────────────────────────────────────────────────────

    public DjiFormTypListResponse formTypen() {
        List<DjiFormTypListResponse.FormTypItem> items = DjiKatalog.alleFormTypen().stream()
                .map(ft -> new DjiFormTypListResponse.FormTypItem(ft.name(), ft.getLabel(), ft.getBeschreibung()))
                .toList();
        return new DjiFormTypListResponse(items);
    }

    // ─── Katalog ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DjiKatalogResponse katalog(Long falloeffnungId, String formTypName) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        DjiFormTyp formTyp = parseFormTyp(formTypName);
        return toKatalogResponse(formTyp);
    }

    // ─── Liste ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DjiAssessmentListItemResponse> list(Long falloeffnungId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        return assessmentRepo.findByFalloeffnungScoped(falloeffnungId, traegerId, einrichtungId)
                .stream()
                .map(this::toListItemResponse)
                .toList();
    }

    // ─── Detail ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DjiAssessmentResponse get(Long falloeffnungId, Long assessmentId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        DjiAssessment assessment = ladeAssessmentScoped(assessmentId, traegerId, einrichtungId);
        List<DjiPosition> positionen = positionRepo.findByAssessment_Id(assessmentId);

        return toResponse(assessment, positionen);
    }

    // ─── Erstellen ──────────────────────────────────────────────────────────────

    @Transactional
    public DjiAssessmentResponse create(Long falloeffnungId, CreateDjiAssessmentRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        DjiFormTyp formTyp  = parseFormTyp(req.formTyp());

        validiereGesamteinschaetzung(formTyp, req.gesamteinschaetzung());

        DjiAssessment assessment = new DjiAssessment();
        assessment.setFalloeffnung(fall);
        assessment.setTraeger(fall.getTraeger());
        assessment.setEinrichtungOrgUnit(fall.getEinrichtungOrgUnit());
        assessment.setFormTyp(formTyp);
        assessment.setBewertungsdatum(req.bewertungsdatum());
        assessment.setGesamteinschaetzung(req.gesamteinschaetzung());
        assessment.setGesamtfreitext(req.gesamtfreitext());
        assessment.setCreatedBy(userRepo.getReferenceById(SecurityUtils.currentUserId()));

        assessmentRepo.save(assessment);

        List<DjiPosition> positionen = speicherePositionen(assessment, formTyp, req.positionen());
        return toResponse(assessment, positionen);
    }

    // ─── Aktualisieren ──────────────────────────────────────────────────────────

    @Transactional
    public DjiAssessmentResponse update(Long falloeffnungId, Long assessmentId, CreateDjiAssessmentRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        DjiAssessment assessment = ladeAssessmentScoped(assessmentId, traegerId, einrichtungId);

        // formTyp ist unveränderlich nach Erstellung
        DjiFormTyp formTyp = assessment.getFormTyp();

        validiereGesamteinschaetzung(formTyp, req.gesamteinschaetzung());

        assessment.setBewertungsdatum(req.bewertungsdatum());
        assessment.setGesamteinschaetzung(req.gesamteinschaetzung());
        assessment.setGesamtfreitext(req.gesamtfreitext());

        positionRepo.deleteByAssessmentId(assessmentId);
        List<DjiPosition> positionen = speicherePositionen(assessment, formTyp, req.positionen());

        return toResponse(assessment, positionen);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Falleroeffnung ladeFallScoped(Long falloeffnungId, Long traegerId, Long einrichtungId) {
        return fallRepo.findByIdWithRefsScoped(falloeffnungId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fallöffnung nicht gefunden."));
    }

    private DjiAssessment ladeAssessmentScoped(Long assessmentId, Long traegerId, Long einrichtungId) {
        return assessmentRepo.findByIdScoped(assessmentId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Assessment nicht gefunden."));
    }

    private DjiFormTyp parseFormTyp(String name) {
        try {
            return DjiFormTyp.valueOf(name);
        } catch (IllegalArgumentException e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unbekannter Formtyp: " + name);
        }
    }

    private void validiereGesamteinschaetzung(DjiFormTyp formTyp, String wert) {
        if (!formTyp.istGueltigeGesamteinschaetzung(wert)) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED,
                    "Ungültige Gesamteinschätzung '" + wert + "' für Formtyp " + formTyp.name());
        }
    }

    private List<DjiPosition> speicherePositionen(
            DjiAssessment assessment,
            DjiFormTyp formTyp,
            List<DjiPositionRequest> requests) {

        if (requests == null || requests.isEmpty()) return List.of();

        // Doppelte Codes ablehnen
        long distinct = requests.stream().map(DjiPositionRequest::positionCode).distinct().count();
        if (distinct != requests.size()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Doppelte positionCodes in der Anfrage.");
        }

        return requests.stream().map(req -> {
            if (!DjiKatalog.istGueltigerCode(formTyp, req.positionCode())) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED,
                        "Ungültiger positionCode für Formtyp " + formTyp + ": " + req.positionCode());
            }
            if (req.bewertungStufe() != null && (req.bewertungStufe() < 0 || req.bewertungStufe() > 5)) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED,
                        "Ungültige bewertungStufe: " + req.bewertungStufe() + ". Erlaubt: 0–5");
            }

            DjiPosition pos = new DjiPosition();
            pos.setAssessment(assessment);
            pos.setPositionCode(req.positionCode());
            pos.setBelege(req.belege());
            pos.setBewertungBool(req.bewertungBool());
            pos.setBewertungStufe(req.bewertungStufe());
            return positionRepo.save(pos);
        }).toList();
    }

    // ─── Mapping ────────────────────────────────────────────────────────────────

    private DjiAssessmentResponse toResponse(DjiAssessment a, List<DjiPosition> positionen) {
        Map<String, DjiItem> katalog = DjiKatalog.alsMap(a.getFormTyp());

        List<DjiPositionResponse> posResponses = positionen.stream().map(p -> {
            DjiItem item = katalog.get(p.getPositionCode());
            String label      = item != null ? item.label()         : p.getPositionCode();
            String bereich    = item != null ? item.bereich()       : null;
            String bwTyp      = item != null ? item.bewertungstyp().name() : null;
            return new DjiPositionResponse(
                    p.getPositionCode(), label, bereich, bwTyp,
                    p.getBelege(), p.getBewertungBool(), p.getBewertungStufe());
        }).toList();

        String gesamtLabel = gesamteinschaetzungLabel(a.getFormTyp(), a.getGesamteinschaetzung());

        return new DjiAssessmentResponse(
                a.getId(),
                a.getFalloeffnung().getId(),
                a.getFormTyp().name(),
                a.getFormTyp().getLabel(),
                a.getBewertungsdatum(),
                posResponses,
                a.getGesamteinschaetzung(),
                gesamtLabel,
                a.getGesamtfreitext(),
                a.getCreatedBy().getDisplayName(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private DjiAssessmentListItemResponse toListItemResponse(DjiAssessment a) {
        String gesamtLabel = gesamteinschaetzungLabel(a.getFormTyp(), a.getGesamteinschaetzung());
        return new DjiAssessmentListItemResponse(
                a.getId(),
                a.getFalloeffnung().getId(),
                a.getFormTyp().name(),
                a.getFormTyp().getLabel(),
                a.getBewertungsdatum(),
                a.getGesamteinschaetzung(),
                gesamtLabel,
                a.getCreatedBy().getDisplayName(),
                a.getCreatedAt()
        );
    }

    private DjiKatalogResponse toKatalogResponse(DjiFormTyp formTyp) {
        List<DjiKatalogResponse.GesamtOption> optionen = formTyp.getGesamteinschaetzungOptionen().stream()
                .map(o -> new DjiKatalogResponse.GesamtOption(o.code(), o.label()))
                .toList();

        List<DjiKatalogResponse.KatalogItem> items = DjiKatalog.itemsFuer(formTyp).stream()
                .map(i -> new DjiKatalogResponse.KatalogItem(
                        i.code(), i.label(), i.bereich(), i.bewertungstyp().name()))
                .toList();

        return new DjiKatalogResponse(
                formTyp.name(), formTyp.getLabel(), formTyp.getBeschreibung(),
                optionen, items);
    }

    private String gesamteinschaetzungLabel(DjiFormTyp formTyp, String code) {
        if (code == null) return null;
        return formTyp.getGesamteinschaetzungOptionen().stream()
                .filter(o -> o.code().equals(code))
                .map(DjiFormTyp.GesamtOption::label)
                .findFirst()
                .orElse(code);
    }
}
