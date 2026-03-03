// src/main/java/org/thomcgn/backend/dossiers/service/AkteService.java
package org.thomcgn.backend.dossiers.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.dossiers.dto.AkteResponse;
import org.thomcgn.backend.dossiers.dto.CreateFallInAkteRequest;
import org.thomcgn.backend.dossiers.model.KindDossier;
import org.thomcgn.backend.dossiers.repo.KindDossierRepository;
import org.thomcgn.backend.falloeffnungen.dto.CreateFalleroeffnungRequest;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungListItemResponse;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.service.FalleroeffnungService;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.people.repo.KindRepository;

import java.util.List;
import java.util.Set;

@Service
public class AkteService {

    private final KindDossierRepository dossierRepo;
    private final KindRepository kindRepo;
    private final OrgUnitRepository orgUnitRepo;
    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungService fallService;
    private final AccessControlService access;

    public AkteService(
            KindDossierRepository dossierRepo,
            KindRepository kindRepo,
            OrgUnitRepository orgUnitRepo,
            FalleroeffnungRepository fallRepo,
            FalleroeffnungService fallService,
            AccessControlService access
    ) {
        this.dossierRepo = dossierRepo;
        this.kindRepo = kindRepo;
        this.orgUnitRepo = orgUnitRepo;
        this.fallRepo = fallRepo;
        this.fallService = fallService;
        this.access = access;
    }

    // ---------------- Akte: resolve/create ----------------

    @Transactional
    public AkteResponse getOrCreateAkteByKind(Long kindId) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        Kind kind = kindRepo.findById(kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));

        OrgUnit einrichtung = orgUnitRepo.findById(einrichtungOrgUnitId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Einrichtung not found"));

        // Defense-in-depth: Einrichtung muss zu aktuellem Träger gehören
        if (einrichtung.getTraeger() == null || einrichtung.getTraeger().getId() == null
                || !einrichtung.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Einrichtung not in current traeger scope");
        }

        // 1) fast path: existiert?
        var existing = dossierRepo.findByEinrichtungOrgUnit_IdAndKind_Id(einrichtungOrgUnitId, kindId);
        if (existing.isPresent()) {
            return getAkte(existing.get().getId());
        }

        // 2) create path (race-condition safe)
        try {
            KindDossier d = new KindDossier();
            d.setEinrichtungOrgUnit(einrichtung);
            d.setTraeger(einrichtung.getTraeger()); // ✅ WICHTIG: NOT NULL traeger_id
            d.setKind(kind);
            d.setEnabled(true);

            d = dossierRepo.saveAndFlush(d); // ✅ flush => unique + notnull sofort sichtbar
            return getAkte(d.getId());
        } catch (DataIntegrityViolationException ex) {
            // Parallel hat jemand schon angelegt → nochmal lesen
            KindDossier d2 = dossierRepo.findByEinrichtungOrgUnit_IdAndKind_Id(einrichtungOrgUnitId, kindId)
                    .orElseThrow(() -> ex);
            return getAkte(d2.getId());
        }
    }

    /**
     * exists-Variante: 200/404, KEIN autocreate.
     */
    @Transactional(readOnly = true)
    public AkteResponse getAkteByKindIfExists(Long kindId) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        KindDossier dossier = dossierRepo.findByEinrichtungOrgUnit_IdAndKind_Id(einrichtungOrgUnitId, kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte not found"));

        // Scope/Traeger checks passieren in getAkte()
        return getAkte(dossier.getId());
    }

    // ---------------- Akte: get detail ----------------

    @Transactional(readOnly = true)
    public AkteResponse getAkte(Long akteId) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        KindDossier dossier = dossierRepo.findById(akteId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte not found"));

        // ✅ Harte Einrichtungsschranke
        if (dossier.getEinrichtungOrgUnit() == null || dossier.getEinrichtungOrgUnit().getId() == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Akte missing einrichtung scope");
        }
        if (!dossier.getEinrichtungOrgUnit().getId().equals(einrichtungOrgUnitId)) {
            throw DomainException.forbidden(
                    ErrorCode.CONTEXT_REQUIRED,
                    "Active context differs from requested EINRICHTUNG. Switch context first."
            );
        }

        // ✅ Zusätzlich Traeger-Konsistenz prüfen (defense-in-depth)
        if (dossier.getEinrichtungOrgUnit().getTraeger() == null
                || dossier.getEinrichtungOrgUnit().getTraeger().getId() == null
                || !dossier.getEinrichtungOrgUnit().getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Akte not in current traeger scope");
        }

        // ✅ Scope: aktive OrgUnit im Kontext
        Set<Long> allowedEinrichtungen = Set.of(einrichtungOrgUnitId);

        List<Falleroeffnung> faelle = fallRepo.listByDossierScoped(traegerId, dossier.getId(), allowedEinrichtungen);

        String kindName = ((dossier.getKind().getVorname() == null ? "" : dossier.getKind().getVorname())
                + " "
                + (dossier.getKind().getNachname() == null ? "" : dossier.getKind().getNachname())).trim();

        List<FalleroeffnungListItemResponse> items = faelle.stream()
                .map(f -> new FalleroeffnungListItemResponse(
                        f.getId(),
                        f.getStatus() != null ? f.getStatus().name() : null,
                        f.getTitel(),
                        f.getAktenzeichen(),
                        dossier.getId(),
                        dossier.getKind().getId(),
                        kindName,
                        f.getEinrichtungOrgUnit() != null ? f.getEinrichtungOrgUnit().getId() : null,
                        f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                        f.getCreatedBy() != null ? f.getCreatedBy().getDisplayName() : null,
                        f.getCreatedAt(),
                        null,
                        null
                ))
                .toList();

        return new AkteResponse(
                dossier.getId(),
                dossier.getKind().getId(),
                kindName.isBlank() ? null : kindName,
                dossier.isEnabled(),
                dossier.getCreatedAt(),
                items
        );
    }

    // ---------------- Fall in Akte ----------------

    @Transactional
    public FalleroeffnungResponse createFallInAkte(Long akteId, CreateFallInAkteRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        KindDossier dossier = dossierRepo.findById(akteId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte not found"));

        // ✅ Harte Einrichtungsschranke
        if (dossier.getEinrichtungOrgUnit() == null || dossier.getEinrichtungOrgUnit().getId() == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "Akte missing einrichtung scope");
        }
        if (!dossier.getEinrichtungOrgUnit().getId().equals(einrichtungOrgUnitId)) {
            throw DomainException.forbidden(
                    ErrorCode.CONTEXT_REQUIRED,
                    "Active context differs from requested EINRICHTUNG. Switch context first."
            );
        }

        String defaultTitel = ("Fall für "
                + (dossier.getKind().getVorname() == null ? "" : dossier.getKind().getVorname())
                + " "
                + (dossier.getKind().getNachname() == null ? "" : dossier.getKind().getNachname())).trim();

        CreateFalleroeffnungRequest create = new CreateFalleroeffnungRequest(
                dossier.getKind().getId(),
                einrichtungOrgUnitId, // ✅ immer aus Kontext
                req != null ? req.teamOrgUnitId() : null,
                (req != null && req.titel() != null && !req.titel().isBlank())
                        ? req.titel()
                        : (defaultTitel.isBlank() ? "Fall" : defaultTitel),
                req != null ? req.kurzbeschreibung() : null,
                req != null ? req.anlassCodes() : List.of()
        );

        return fallService.create(create);
    }
}