package org.thomcgn.backend.kinderschutz.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.kinderschutz.catalog.SkbItem;
import org.thomcgn.backend.kinderschutz.catalog.SkbKatalog;
import org.thomcgn.backend.kinderschutz.dto.*;
import org.thomcgn.backend.kinderschutz.model.Altersgruppe;
import org.thomcgn.backend.kinderschutz.model.KinderschutzbogenAssessment;
import org.thomcgn.backend.kinderschutz.model.KinderschutzbogenBewertung;
import org.thomcgn.backend.kinderschutz.repo.KinderschutzbogenAssessmentRepository;
import org.thomcgn.backend.kinderschutz.repo.KinderschutzbogenBewertungRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class KinderschutzbogenService {

    private static final Set<Short> GUELTIGE_RATINGS = Set.of((short) -2, (short) -1, (short) 1, (short) 2);

    private final KinderschutzbogenAssessmentRepository assessmentRepo;
    private final KinderschutzbogenBewertungRepository bewertungRepo;
    private final FalleroeffnungRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    public KinderschutzbogenService(
            KinderschutzbogenAssessmentRepository assessmentRepo,
            KinderschutzbogenBewertungRepository bewertungRepo,
            FalleroeffnungRepository fallRepo,
            UserRepository userRepo,
            AccessControlService access) {
        this.assessmentRepo = assessmentRepo;
        this.bewertungRepo = bewertungRepo;
        this.fallRepo = fallRepo;
        this.userRepo = userRepo;
        this.access = access;
    }

    // ─── Katalog ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public KatalogResponse katalog(Long falloeffnungId) {
        Long traegerId    = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        LocalDate geburtsdatum = fall.getDossier().getKind().getGeburtsdatum();
        Altersgruppe altersgruppe = Altersgruppe.berechnen(geburtsdatum, LocalDate.now());

        return toKatalogResponse(altersgruppe);
    }

    // ─── Liste ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<KinderschutzbogenListItemResponse> list(Long falloeffnungId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        List<KinderschutzbogenAssessment> assessments =
                assessmentRepo.findByFalloeffnungScoped(falloeffnungId, traegerId, einrichtungId);

        return assessments.stream()
                .map(a -> {
                    List<KinderschutzbogenBewertung> bewertungen = bewertungRepo.findByAssessment_Id(a.getId());
                    return toListItemResponse(a, berechneAuto(bewertungen));
                })
                .toList();
    }

    // ─── Detail ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public KinderschutzbogenResponse get(Long falloeffnungId, Long assessmentId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        KinderschutzbogenAssessment assessment = assessmentRepo
                .findByIdScoped(assessmentId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Assessment nicht gefunden."));

        List<KinderschutzbogenBewertung> bewertungen = bewertungRepo.findByAssessment_Id(assessmentId);
        return toResponse(assessment, bewertungen);
    }

    // ─── Erstellen ──────────────────────────────────────────────────────────────

    @Transactional
    public KinderschutzbogenResponse create(Long falloeffnungId, CreateKinderschutzbogenRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        LocalDate geburtsdatum = fall.getDossier().getKind().getGeburtsdatum();
        Altersgruppe altersgruppe = Altersgruppe.berechnen(geburtsdatum, req.bewertungsdatum());

        validiereGesamteinschaetzung(req.gesamteinschaetzungManuell());

        KinderschutzbogenAssessment assessment = new KinderschutzbogenAssessment();
        assessment.setFalloeffnung(fall);
        assessment.setTraeger(fall.getTraeger());
        assessment.setEinrichtungOrgUnit(fall.getEinrichtungOrgUnit());
        assessment.setAltersgruppe(altersgruppe);
        assessment.setBewertungsdatum(req.bewertungsdatum());
        assessment.setGesamteinschaetzungManuell(req.gesamteinschaetzungManuell());
        assessment.setGesamteinschaetzungFreitext(req.gesamteinschaetzungFreitext());
        assessment.setCreatedBy(userRepo.getReferenceById(SecurityUtils.currentUserId()));

        assessmentRepo.save(assessment);

        List<KinderschutzbogenBewertung> bewertungen = speichereBewertungen(assessment, altersgruppe, req.bewertungen());
        return toResponse(assessment, bewertungen);
    }

    // ─── Aktualisieren ──────────────────────────────────────────────────────────

    @Transactional
    public KinderschutzbogenResponse update(Long falloeffnungId, Long assessmentId, CreateKinderschutzbogenRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();

        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        KinderschutzbogenAssessment assessment = assessmentRepo
                .findByIdScoped(assessmentId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Assessment nicht gefunden."));

        LocalDate geburtsdatum = assessment.getFalloeffnung().getDossier().getKind().getGeburtsdatum();
        Altersgruppe altersgruppe = Altersgruppe.berechnen(geburtsdatum, req.bewertungsdatum());

        validiereGesamteinschaetzung(req.gesamteinschaetzungManuell());

        assessment.setBewertungsdatum(req.bewertungsdatum());
        assessment.setAltersgruppe(altersgruppe);
        assessment.setGesamteinschaetzungManuell(req.gesamteinschaetzungManuell());
        assessment.setGesamteinschaetzungFreitext(req.gesamteinschaetzungFreitext());

        bewertungRepo.deleteByAssessmentId(assessmentId);
        List<KinderschutzbogenBewertung> bewertungen = speichereBewertungen(assessment, altersgruppe, req.bewertungen());

        return toResponse(assessment, bewertungen);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Falleroeffnung ladeFallScoped(Long falloeffnungId, Long traegerId, Long einrichtungId) {
        return fallRepo.findByIdWithRefsScoped(falloeffnungId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fallöffnung nicht gefunden."));
    }

    private List<KinderschutzbogenBewertung> speichereBewertungen(
            KinderschutzbogenAssessment assessment,
            Altersgruppe altersgruppe,
            List<BewertungRequest> requests) {

        if (requests == null || requests.isEmpty()) return List.of();

        // Doppelte item_codes ablehnen
        long distinct = requests.stream().map(BewertungRequest::itemCode).distinct().count();
        if (distinct != requests.size()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Doppelte itemCodes in der Anfrage.");
        }

        return requests.stream().map(req -> {
            if (!SkbKatalog.istGueltigerCode(altersgruppe, req.itemCode())) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED,
                        "Ungültiger itemCode für Altersgruppe " + altersgruppe + ": " + req.itemCode());
            }
            if (req.rating() != null && !GUELTIGE_RATINGS.contains(req.rating())) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED,
                        "Ungültiger Rating-Wert: " + req.rating() + ". Erlaubt: -2, -1, 1, 2");
            }

            KinderschutzbogenBewertung b = new KinderschutzbogenBewertung();
            b.setAssessment(assessment);
            b.setItemCode(req.itemCode());
            b.setRating(req.rating());
            b.setNotiz(req.notiz());
            return bewertungRepo.save(b);
        }).toList();
    }

    private double berechneAuto(List<KinderschutzbogenBewertung> bewertungen) {
        OptionalDouble avg = bewertungen.stream()
                .filter(b -> b.getRating() != null)
                .mapToInt(b -> b.getRating())
                .average();
        return avg.isPresent() ? Math.round(avg.getAsDouble() * 100.0) / 100.0 : 0.0;
    }

    private void validiereGesamteinschaetzung(Short wert) {
        if (wert != null && !GUELTIGE_RATINGS.contains(wert)) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED,
                    "Ungültige Gesamteinschätzung: " + wert + ". Erlaubt: -2, -1, 1, 2");
        }
    }

    // ─── Mapping ────────────────────────────────────────────────────────────────

    private KinderschutzbogenResponse toResponse(
            KinderschutzbogenAssessment a,
            List<KinderschutzbogenBewertung> bewertungen) {

        Map<String, SkbItem> katalog = SkbKatalog.itemsFuer(a.getAltersgruppe())
                .stream().collect(Collectors.toMap(SkbItem::code, i -> i));

        List<BewertungResponse> bResponses = bewertungen.stream().map(b -> {
            SkbItem item = katalog.get(b.getItemCode());
            String label  = item != null ? item.label()  : b.getItemCode();
            String bereich = item != null ? item.bereich().name() : "";
            return new BewertungResponse(b.getItemCode(), label, bereich, b.getRating(), b.getNotiz());
        }).toList();

        return new KinderschutzbogenResponse(
                a.getId(),
                a.getFalloeffnung().getId(),
                a.getAltersgruppe().name(),
                a.getAltersgruppe().getLabel(),
                a.getBewertungsdatum(),
                bResponses,
                berechneAuto(bewertungen),
                a.getGesamteinschaetzungManuell(),
                a.getGesamteinschaetzungFreitext(),
                a.getCreatedBy().getDisplayName(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }

    private KinderschutzbogenListItemResponse toListItemResponse(
            KinderschutzbogenAssessment a, double auto) {
        return new KinderschutzbogenListItemResponse(
                a.getId(),
                a.getFalloeffnung().getId(),
                a.getAltersgruppe().name(),
                a.getAltersgruppe().getLabel(),
                a.getBewertungsdatum(),
                auto,
                a.getGesamteinschaetzungManuell(),
                a.getCreatedBy().getDisplayName(),
                a.getCreatedAt()
        );
    }

    private KatalogResponse toKatalogResponse(Altersgruppe altersgruppe) {
        List<KatalogResponse.KatalogItemResponse> items = SkbKatalog.itemsFuer(altersgruppe).stream()
                .map(i -> new KatalogResponse.KatalogItemResponse(
                        i.code(), i.label(), i.bereich().name(), i.bereich().getLabel()))
                .toList();
        return new KatalogResponse(altersgruppe.name(), altersgruppe.getLabel(), items);
    }
}
