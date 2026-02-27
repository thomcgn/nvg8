package org.thomcgn.backend.people.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.dto.AddNotizRequest;
import org.thomcgn.backend.falloeffnungen.dto.CreateFalleroeffnungRequest;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.service.FalleroeffnungService;
import org.thomcgn.backend.people.dto.*;
import org.thomcgn.backend.people.model.*;
import org.thomcgn.backend.people.repo.BezugspersonRepository;
import org.thomcgn.backend.people.repo.KindBezugspersonRepository;
import org.thomcgn.backend.people.repo.KindRepository;

import java.time.LocalDate;
import java.util.List;

@Service
public class KindService {

    private final KindRepository kindRepo;
    private final BezugspersonRepository bezugRepo;
    private final KindBezugspersonRepository linkRepo;

    private final BezugspersonService bezugspersonService;
    private final AccessControlService access;

    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungService fallService;

    public KindService(
            KindRepository kindRepo,
            BezugspersonRepository bezugRepo,
            KindBezugspersonRepository linkRepo,
            BezugspersonService bezugspersonService,
            AccessControlService access,
            FalleroeffnungRepository fallRepo,
            FalleroeffnungService fallService
    ) {
        this.kindRepo = kindRepo;
        this.bezugRepo = bezugRepo;
        this.linkRepo = linkRepo;
        this.bezugspersonService = bezugspersonService;
        this.access = access;
        this.fallRepo = fallRepo;
        this.fallService = fallService;
    }

    // =====================================================
    // Kind
    // =====================================================

    @Transactional
    public KindResponse create(CreateKindRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (req == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "request required");
        }

        Kind k = new Kind();

        // Scope/Owner
        k.setTraegerId(SecurityUtils.currentTraegerIdRequired());
        Long ownerEinrichtung = access.activeEinrichtungId();
        if (ownerEinrichtung == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "No active Einrichtung in context.");
        }
        k.setOwnerEinrichtungOrgUnitId(ownerEinrichtung);

        // Fachfelder
        k.setVorname(req.vorname());
        k.setNachname(req.nachname());
        k.setGeburtsdatum(req.geburtsdatum());
        k.setGender(req.gender() != null ? req.gender() : Gender.UNBEKANNT);

        // optional (falls in CreateKindRequest vorhanden)
        k.setFoerderbedarf(req.foerderbedarf());
        k.setFoerderbedarfDetails(req.foerderbedarfDetails());
        k.setGesundheitsHinweise(req.gesundheitsHinweise());

        access.requireAccessToEinrichtungObject(
                k.getTraegerId(),
                k.getOwnerEinrichtungOrgUnitId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        Kind saved = kindRepo.save(k);
        return toDto(saved);
    }

    @Transactional
    public CreateKindResponse createComplete(CreateKindCompleteRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (req == null || req.kind() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "kind required");
        }
        if (req.bezugspersonen() == null || req.bezugspersonen().isEmpty()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Mindestens eine Bezugsperson ist erforderlich");
        }

        KindResponse created = create(req.kind());
        Long kindId = created.id();

        for (AddKindBezugspersonRequest bpReq : req.bezugspersonen()) {
            addBezugsperson(kindId, bpReq);
        }

        return new CreateKindResponse(kindId);
    }

    @Transactional(readOnly = true)
    public KindResponse get(Long id) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Kind k = kindRepo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));

        access.requireAccessToEinrichtungObject(
                k.getTraegerId(),
                k.getOwnerEinrichtungOrgUnitId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return toDto(k);
    }

    // =====================================================
    // Bezugsperson-Beziehungen
    // =====================================================

    @Transactional(readOnly = true)
    public List<KindBezugspersonResponse> listBezugspersonen(Long kindId, boolean includeInactive) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Kind k = kindRepo.findById(kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));

        access.requireAccessToEinrichtungObject(
                k.getTraegerId(),
                k.getOwnerEinrichtungOrgUnitId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        List<KindBezugsperson> links = includeInactive
                ? linkRepo.findByKindId(kindId)
                : linkRepo.findActiveByKindId(kindId, LocalDate.now());

        return links.stream().map(this::toLinkDto).toList();
    }

    @Transactional
    public KindBezugspersonResponse addBezugsperson(Long kindId, AddKindBezugspersonRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (req == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "request required");
        }

        Kind kind = kindRepo.findById(kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));

        access.requireAccessToEinrichtungObject(
                kind.getTraegerId(),
                kind.getOwnerEinrichtungOrgUnitId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        boolean hasExisting = req.existingBezugspersonId() != null;
        boolean hasCreate = req.create() != null;
        if (hasExisting == hasCreate) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "entweder existingBezugspersonId oder create");
        }
        if (req.beziehung() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "beziehung required");
        }

        Bezugsperson bp = hasExisting
                ? bezugRepo.findById(req.existingBezugspersonId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Bezugsperson not found"))
                : bezugspersonService.createEntity(req.create());

        KindBezugsperson link = new KindBezugsperson();
        link.setKind(kind);
        link.setBezugsperson(bp);
        link.setBeziehung(req.beziehung());

        link.setSorgerecht(req.sorgerecht() != null ? req.sorgerecht() : SorgerechtTyp.UNGEKLAERT);
        link.setValidFrom(req.validFrom() != null ? req.validFrom() : LocalDate.now());
        link.setValidTo(null);

        link.setHauptkontakt(Boolean.TRUE.equals(req.hauptkontakt()));
        link.setLebtImHaushalt(Boolean.TRUE.equals(req.lebtImHaushalt()));
        link.setEnabled(true);

        return toLinkDto(linkRepo.save(link));
    }

    /**
     * Link beenden (kein Delete) und IMMER in die Akte schreiben.
     * Falls keine Akte existiert, wird eine automatisch angelegt.
     */
    @Transactional
    public KindBezugspersonResponse endBezugspersonLink(Long kindId, Long linkId, EndKindBezugspersonRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        KindBezugsperson link = linkRepo.findByIdAndKindId(linkId, kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Link not found"));

        Kind kind = link.getKind();

        access.requireAccessToEinrichtungObject(
                kind.getTraegerId(),
                kind.getOwnerEinrichtungOrgUnitId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        if (req == null || req.validTo() == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "validTo required");
        }
        if (req.validTo().isBefore(link.getValidFrom())) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "validTo darf nicht vor validFrom liegen");
        }

        link.setValidTo(req.validTo());
        link.setEnabled(false);

        KindBezugsperson saved = linkRepo.save(link);

        // Akte sicherstellen + Notiz schreiben (immer)
        Falleroeffnung fall = ensureFallExistsForKind(kind, saved);

        String noteText = buildAkteMessage(kind, saved);

        AddNotizRequest noteReq = new AddNotizRequest(
                "KIND_BEZUGSPERSON_LINK_ENDED",
                noteText,   // @NotBlank
                "INTERN",
                null,
                null
        );

        fallService.addNotiz(fall.getId(), noteReq);

        return toLinkDto(saved);
    }

    // =====================================================
    // Search
    // =====================================================

    @Transactional(readOnly = true)
    public KindSearchResponse search(String q, int page, int size) {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        if (einrichtungId == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "No active Einrichtung in context.");
        }

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Kind> res = kindRepo.search(traegerId, einrichtungId, q, pageable);

        return new KindSearchResponse(
                res.getContent().stream()
                        .map(k -> new KindListItem(
                                k.getId(),
                                k.getDisplayName(),
                                k.getGeburtsdatum(),
                                k.getGender(),
                                k.isFoerderbedarf()
                        ))
                        .toList(),
                res.getTotalElements(),
                safePage,
                safeSize
        );
    }

    // =====================================================
    // Internals
    // =====================================================

    private Falleroeffnung ensureFallExistsForKind(Kind kind, KindBezugsperson link) {
        Long traegerId = kind.getTraegerId();
        Long einrichtungId = kind.getOwnerEinrichtungOrgUnitId();

        Falleroeffnung existing = fallRepo
                .findLatestByKindIdScoped(traegerId, einrichtungId, kind.getId(), PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElse(null);

        if (existing != null) return existing;

        String titel = "Automatisch angelegte Akte (Bezugsperson-Änderung)";
        String kurz = buildAkteMessage(kind, link);

        // ✅ CreateFalleroeffnungRequest erwartet 6 Parameter (inkl. anlassCodes)
        CreateFalleroeffnungRequest createReq = new CreateFalleroeffnungRequest(
                kind.getId(),
                einrichtungId,
                null,   // teamOrgUnitId
                titel,
                kurz,
                null    // anlassCodes
        );

        FalleroeffnungResponse created = fallService.create(createReq);

        return fallRepo.findById(created.id())
                .orElseThrow(() -> DomainException.conflict(ErrorCode.CONFLICT, "Auto-created Falleroeffnung not found"));
    }

    private String buildAkteMessage(Kind kind, KindBezugsperson link) {
        String kindName = kind.getDisplayName();
        String bpName = link.getBezugsperson() != null ? link.getBezugsperson().getDisplayName() : "-";
        String beziehung = link.getBeziehung() != null ? link.getBeziehung().name() : "-";
        String validTo = link.getValidTo() != null ? link.getValidTo().toString() : "-";

        return "Bezugsperson-Verknüpfung beendet"
                + " | Kind: " + kindName
                + " | Bezugsperson: " + bpName + " (" + beziehung + ")"
                + " | gültig bis: " + validTo;
    }

    // =====================================================
    // Mapping
    // =====================================================

    private KindResponse toDto(Kind k) {
        return new KindResponse(
                k.getId(),
                k.getVorname(),
                k.getNachname(),
                k.getGeburtsdatum(),
                k.getGender() != null ? k.getGender() : Gender.UNBEKANNT,
                k.isFoerderbedarf(),
                k.getFoerderbedarfDetails(),
                k.getGesundheitsHinweise()
        );
    }

    private KindBezugspersonResponse toLinkDto(KindBezugsperson l) {
        String name = l.getBezugsperson() != null ? l.getBezugsperson().getDisplayName() : "-";
        Long bpId = l.getBezugsperson() != null ? l.getBezugsperson().getId() : null;

        return new KindBezugspersonResponse(
                l.getId(),
                bpId,
                name,
                l.getBeziehung(),
                l.getSorgerecht(),
                l.getValidFrom(),
                l.getValidTo(),
                l.isHauptkontakt(),
                l.isLebtImHaushalt(),
                l.isEnabled()
        );
    }
}