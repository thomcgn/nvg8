package org.thomcgn.backend.falloeffnungen.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.audit.model.AuditEventAction;
import org.thomcgn.backend.audit.service.AuditService;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.dossiers.model.KindDossier;
import org.thomcgn.backend.dossiers.repo.KindDossierRepository;
import org.thomcgn.backend.falloeffnungen.dto.*;
import org.thomcgn.backend.falloeffnungen.model.*;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungNotizRepository;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.risk.AnlassCatalog;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungAnlass;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungNotizTag;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungAnlassRepository;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungNotizTagRepository;
import org.thomcgn.backend.falloeffnungen.risk.service.FallRiskService;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.people.repo.KindRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;
import org.thomcgn.backend.falloeffnungen.dto.CreateFalleroeffnungRequest;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class FalleroeffnungService {

    private final FalleroeffnungRepository repo;
    private final FalleroeffnungNotizRepository notizRepo;
    private final KindDossierRepository dossierRepo;
    private final KindRepository kindRepo;
    private final TraegerRepository traegerRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;
    private final AuditService audit;
    private final org.thomcgn.backend.aktenzeichen.service.AktennummerService aktennummerService;

    private final FalleroeffnungAnlassRepository anlassRepo;
    private final FalleroeffnungNotizTagRepository tagRepo;
    private final FallRiskService riskService;

    public FalleroeffnungService(
            FalleroeffnungRepository repo,
            FalleroeffnungNotizRepository notizRepo,
            KindDossierRepository dossierRepo,
            KindRepository kindRepo,
            TraegerRepository traegerRepo,
            OrgUnitRepository orgUnitRepo,
            UserRepository userRepo,
            AccessControlService access,
            AuditService audit,
            org.thomcgn.backend.aktenzeichen.service.AktennummerService aktennummerService,
            FalleroeffnungAnlassRepository anlassRepo,
            FalleroeffnungNotizTagRepository tagRepo,
            FallRiskService riskService
    ) {
        this.repo = repo;
        this.notizRepo = notizRepo;
        this.dossierRepo = dossierRepo;
        this.kindRepo = kindRepo;
        this.traegerRepo = traegerRepo;
        this.orgUnitRepo = orgUnitRepo;
        this.userRepo = userRepo;
        this.access = access;
        this.audit = audit;
        this.aktennummerService = aktennummerService;
        this.anlassRepo = anlassRepo;
        this.tagRepo = tagRepo;
        this.riskService = riskService;
    }

    // =========================================================
    // CREATE (legt Dossier an, falls nicht existiert)
    // =========================================================
    @Transactional
    public FalleroeffnungResponse create(CreateFalleroeffnungRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = SecurityUtils.currentOrgUnitIdRequired();
        Long userId = SecurityUtils.currentUserId();

        // Kontext-Härtung: create immer im aktiven EINRICHTUNG-Kontext
        if (req.einrichtungOrgUnitId() == null || !req.einrichtungOrgUnitId().equals(einrichtungId)) {
            throw DomainException.forbidden(
                    ErrorCode.CONTEXT_REQUIRED,
                    "Active context differs from requested EINRICHTUNG. Switch context first."
            );
        }

        Traeger traeger = traegerRepo.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        Kind kind = kindRepo.findById(req.kindId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));

        KindDossier dossier = dossierRepo.findByTraegerIdAndKindId(traegerId, req.kindId())
                .orElseGet(() -> {
                    KindDossier d = new KindDossier();
                    d.setTraeger(traeger);
                    d.setKind(kind);
                    d.setEnabled(true);
                    return dossierRepo.save(d);
                });

        OrgUnit einrichtung = orgUnitRepo.findById(einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Einrichtung org unit not found"));

        // Defense-in-depth Rollencheck
        access.requireAccessToEinrichtungObject(
                traeger.getId(),
                einrichtung.getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        OrgUnit team = null;
        if (req.teamOrgUnitId() != null) {
            team = orgUnitRepo.findById(req.teamOrgUnitId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Team org unit not found"));
            access.requireTeamUnderEinrichtung(team.getId(), einrichtung.getId());
        }

        User creator = userRepo.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        String prefix = traeger.getAktenPrefix();
        String aktenzeichen = aktennummerService.next(traeger.getId(), prefix);

        Falleroeffnung f = new Falleroeffnung();
        f.setTraeger(traeger);
        f.setDossier(dossier);
        f.setAktenzeichen(aktenzeichen);
        f.setEinrichtungOrgUnit(einrichtung);
        f.setTeamOrgUnit(team);
        f.setStatus(FalleroeffnungStatus.OFFEN);
        f.setTitel(req.titel() != null ? req.titel().trim() : "Fallöffnung");
        f.setKurzbeschreibung(req.kurzbeschreibung());
        f.setCreatedBy(creator);
        f.setOpenedAt(Instant.now());

        Falleroeffnung saved = repo.save(f);

        // Anlässe initial speichern (optional)
        if (req.anlassCodes() != null && !req.anlassCodes().isEmpty()) {
            for (String code : req.anlassCodes()) {
                if (code == null || code.isBlank()) continue;
                String c = code.trim();
                if (!AnlassCatalog.isAllowed(c)) {
                    throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown Anlass code: " + c);
                }
                FalleroeffnungAnlass a = new FalleroeffnungAnlass();
                a.setFalleroeffnung(saved);
                a.setCode(c);
                anlassRepo.save(a);
            }
        }

        audit.log(
                AuditEventAction.FALL_CREATED,
                "Falleroeffnung",
                saved.getId(),
                saved.getEinrichtungOrgUnit().getId(),
                "Falleröffnung created: " + saved.getTitel()
        );

        // Latest risk (optional)
        var latestRisk = riskService.latest(saved.getId());

        List<FalleroeffnungNotizResponse> notizen = List.of();
        List<String> anlaesse = anlassRepo.findCodesByFallId(saved.getId());

        return toResponse(saved, anlaesse, latestRisk, notizen);
    }

    // =========================================================
    // GET (inkl. Notizen) - SCOPED
    // =========================================================
    @Transactional(readOnly = true)
    public FalleroeffnungResponse get(Long id) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        Falleroeffnung f = repo.findByIdWithRefsScoped(id, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        // Notizen scoped laden (sonst Leak über fallId)
        List<FalleroeffnungNotizResponse> notizen = notizRepo
                .findAllByFalleroeffnungIdScopedOrderByCreatedAtAsc(id, tid, oid)
                .stream()
                .map(n -> {
                    var tags = tagRepo.findAllByNotizId(n.getId());
                    var anlassCodes = tags.stream()
                            .map(FalleroeffnungNotizTag::getAnlassCode)
                            .filter(c -> c != null && !c.isBlank())
                            .map(String::trim)
                            .distinct()
                            .toList();
                    var indicatorLinks = tags.stream()
                            .filter(t -> t.getIndicatorId() != null && !t.getIndicatorId().isBlank())
                            .filter(t -> t.getSeverity() != null)
                            .map(t -> new FalleroeffnungNotizResponse.IndicatorLink(t.getIndicatorId().trim(), Math.max(0, Math.min(3, t.getSeverity()))))
                            .toList();

                    return new FalleroeffnungNotizResponse(
                            n.getId(),
                            n.getTyp(),
                            n.getText(),
                            n.getCreatedBy().getDisplayName(),
                            n.getCreatedAt(),
                            anlassCodes,
                            indicatorLinks
                    );
                })
                .toList();

        List<String> fallAnlaesse = anlassRepo.findCodesByFallId(id);
        var latestRisk = riskService.latest(id);

        return toResponse(f, fallAnlaesse, latestRisk, notizen);
    }

    // =========================================================
    // LIST (kontextbasiert: aktive EINRICHTUNG)
    // =========================================================
    @Transactional(readOnly = true)
    public FalleroeffnungListResponse list(String status, String q, Pageable pageable) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long activeEinrichtungId = SecurityUtils.currentOrgUnitIdRequired();

        FalleroeffnungStatus st = null;
        if (status != null && !status.isBlank()) {
            try { st = FalleroeffnungStatus.valueOf(status.trim()); }
            catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + status); }
        }

        String query = (q == null || q.isBlank()) ? null : q.trim();

        Page<Falleroeffnung> page = repo.searchScoped(
                traegerId,
                Set.of(activeEinrichtungId),
                st,
                query,
                pageable
        );

        List<FalleroeffnungListItemResponse> items = page.getContent().stream()
                .map(f -> {
                    var k = f.getDossier().getKind();
                    String kindName = ((k.getVorname() != null ? k.getVorname() : "") + " " + (k.getNachname() != null ? k.getNachname() : "")).trim();
                    if (kindName.isBlank()) kindName = "-";
                    return new FalleroeffnungListItemResponse(
                            f.getId(),
                            f.getStatus().name(),
                            f.getTitel(),
                            f.getAktenzeichen(),
                            f.getDossier().getId(),
                            k.getId(),
                            kindName,
                            f.getEinrichtungOrgUnit().getId(),
                            f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                            f.getCreatedBy().getDisplayName(),
                            f.getCreatedAt()
                    );
                })
                .toList();

        return new FalleroeffnungListResponse(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    // =========================================================
    // ADD NOTE (append-only) + VISIBILITY - SCOPED
    // =========================================================
    @Transactional
    public FalleroeffnungNotizResponse addNotiz(Long id, AddNotizRequest req) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        Falleroeffnung f = repo.findByIdWithRefsScoped(id, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        if (f.getStatus() == FalleroeffnungStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Falleröffnung is closed (read-only).");
        }

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.SCHREIBEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        User author = userRepo.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        NoteVisibility vis = NoteVisibility.INTERN;
        if (req.visibility() != null && !req.visibility().isBlank()) {
            try { vis = NoteVisibility.valueOf(req.visibility().trim()); }
            catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown visibility: " + req.visibility()); }
        }

        FalleroeffnungNotiz n = new FalleroeffnungNotiz();
        n.setFalleroeffnung(f);
        n.setCreatedBy(author);
        n.setTyp(req.typ());
        n.setText(req.text().trim());
        n.setVisibility(vis);

        FalleroeffnungNotiz saved = notizRepo.save(n);

        // --- Tags speichern (Anlass + 0..n Indikator/Severity) ---
        if (req.anlassCodes() != null) {
            for (String code : req.anlassCodes()) {
                if (code == null || code.isBlank()) continue;
                String c = code.trim();
                if (!AnlassCatalog.isAllowed(c)) {
                    throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown Anlass code: " + c);
                }
                FalleroeffnungNotizTag t = new FalleroeffnungNotizTag();
                t.setNotiz(saved);
                t.setAnlassCode(c);
                tagRepo.save(t);
            }
        }

        if (req.indicatorLinks() != null) {
            for (AddNotizRequest.IndicatorLink link : req.indicatorLinks()) {
                if (link == null) continue;
                if (link.indicatorId() == null || link.indicatorId().isBlank()) continue;

                Integer sev = link.severity();
                int s = sev == null ? 0 : Math.max(0, Math.min(3, sev));

                FalleroeffnungNotizTag t = new FalleroeffnungNotizTag();
                t.setNotiz(saved);
                t.setIndicatorId(link.indicatorId().trim());
                t.setSeverity(s);
                tagRepo.save(t);
            }
        }

        audit.log(
                AuditEventAction.FALL_NOTE_ADDED,
                "Falleroeffnung",
                f.getId(),
                f.getEinrichtungOrgUnit().getId(),
                "Note added" + (req.typ() != null ? " (" + req.typ() + ")" : "") + " visibility=" + vis
        );

        // Optional: neu bewerten und Snapshot speichern (UX)
        try {
            riskService.recomputeAndSnapshot(f.getId());
        } catch (Exception ignored) {
            // Bewertung ist Assistenz; Notiz speichern ist wichtiger.
        }

        // Response inkl. Tags (für UI sofort)
        var tags = tagRepo.findAllByNotizId(saved.getId());
        var anlassCodes = tags.stream()
                .map(FalleroeffnungNotizTag::getAnlassCode)
                .filter(c -> c != null && !c.isBlank())
                .map(String::trim)
                .distinct()
                .toList();
        var indicatorLinks = tags.stream()
                .filter(t -> t.getIndicatorId() != null && !t.getIndicatorId().isBlank())
                .filter(t -> t.getSeverity() != null)
                .map(t -> new FalleroeffnungNotizResponse.IndicatorLink(t.getIndicatorId().trim(), Math.max(0, Math.min(3, t.getSeverity()))))
                .toList();

        return new FalleroeffnungNotizResponse(
                saved.getId(),
                saved.getTyp(),
                saved.getText(),
                author.getDisplayName(),
                saved.getCreatedAt(),
                anlassCodes,
                indicatorLinks
        );
    }

    // =========================================================
    // UPDATE STATUS - SCOPED
    // =========================================================
    @Transactional
    public FalleroeffnungResponse updateStatus(Long id, UpdateFalleroeffnungStatusRequest req) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        Falleroeffnung f = repo.findByIdWithRefsScoped(id, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        FalleroeffnungStatus newStatus;
        try { newStatus = FalleroeffnungStatus.valueOf(req.status().trim()); }
        catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + req.status()); }

        FalleroeffnungStatus old = f.getStatus();
        if (old == FalleroeffnungStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Closed fall opening cannot change status.");
        }
        if (old == newStatus) return get(id);

        if (newStatus == FalleroeffnungStatus.ABGESCHLOSSEN) {
            access.requireAny(Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
            f.setClosedAt(Instant.now());
        }

        f.setStatus(newStatus);

        audit.log(
                AuditEventAction.FALL_STATUS_CHANGED,
                "Falleroeffnung",
                f.getId(),
                f.getEinrichtungOrgUnit().getId(),
                "Status changed from " + old + " to " + newStatus
        );

        return get(id);
    }

    private FalleroeffnungResponse toResponse(
            Falleroeffnung f,
            List<String> anlassCodes,
            org.thomcgn.backend.falloeffnungen.risk.dto.RiskSnapshotResponse latestRisk,
            List<FalleroeffnungNotizResponse> notizen
    ) {
        var k = f.getDossier().getKind();
        String kindName = ((k.getVorname() != null ? k.getVorname() : "") + " " + (k.getNachname() != null ? k.getNachname() : "")).trim();
        if (kindName.isBlank()) kindName = "-";

        return new FalleroeffnungResponse(
                f.getId(),
                f.getAktenzeichen(),
                f.getStatus().name(),
                f.getTitel(),
                f.getKurzbeschreibung(),
                f.getTraeger().getId(),
                f.getDossier().getId(),
                k.getId(),
                kindName,
                f.getEinrichtungOrgUnit().getId(),
                f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                f.getCreatedBy().getDisplayName(),
                anlassCodes != null ? anlassCodes : List.of(),
                latestRisk,
                notizen
        );
    }
}