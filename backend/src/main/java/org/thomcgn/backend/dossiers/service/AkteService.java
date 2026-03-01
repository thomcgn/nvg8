package org.thomcgn.backend.dossiers.service;

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
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungListItemResponse;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;
import org.thomcgn.backend.falloeffnungen.dto.CreateFalleroeffnungRequest;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.service.FalleroeffnungService;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.people.repo.KindRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;

import java.util.List;
import java.util.Set;

@Service
public class AkteService {

    private final KindDossierRepository dossierRepo;
    private final KindRepository kindRepo;
    private final TraegerRepository traegerRepo;
    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungService fallService;
    private final AccessControlService access;

    public AkteService(
            KindDossierRepository dossierRepo,
            KindRepository kindRepo,
            TraegerRepository traegerRepo,
            FalleroeffnungRepository fallRepo,
            FalleroeffnungService fallService,
            AccessControlService access
    ) {
        this.dossierRepo = dossierRepo;
        this.kindRepo = kindRepo;
        this.traegerRepo = traegerRepo;
        this.fallRepo = fallRepo;
        this.fallService = fallService;
        this.access = access;
    }

    @Transactional
    public AkteResponse getOrCreateAkteByKind(Long kindId) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Kind kind = kindRepo.findById(kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));

        Traeger traeger = traegerRepo.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        KindDossier dossier = dossierRepo.findByTraegerIdAndKindId(traegerId, kindId)
                .orElseGet(() -> {
                    KindDossier d = new KindDossier();
                    d.setTraeger(traeger);
                    d.setKind(kind);
                    d.setEnabled(true);
                    return dossierRepo.save(d);
                });

        return getAkte(dossier.getId());
    }

    @Transactional(readOnly = true)
    public AkteResponse getAkte(Long akteId) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        KindDossier dossier = dossierRepo.findById(akteId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte not found"));

        if (!dossier.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.CONFLICT, "Akte not in current traeger scope");
        }

        // ✅ Scope: aktive OrgUnit im Kontext
        Set<Long> allowedEinrichtungen = SecurityUtils.currentOrgUnitIdsScoped();

        List<Falleroeffnung> faelle = fallRepo.listByDossierScoped(traegerId, dossier.getId(), allowedEinrichtungen);

        String kindName = (dossier.getKind().getVorname() + " " + dossier.getKind().getNachname()).trim();

        List<FalleroeffnungListItemResponse> items = faelle.stream().map(f -> new FalleroeffnungListItemResponse(
                f.getId(),
                f.getStatus().name(),
                f.getTitel(),
                f.getAktenzeichen(),
                dossier.getId(),
                dossier.getKind().getId(),
                kindName,
                f.getEinrichtungOrgUnit().getId(),
                f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                f.getCreatedBy() != null ? f.getCreatedBy().getDisplayName() : null,
                f.getCreatedAt()
        )).toList();

        return new AkteResponse(
                dossier.getId(),
                dossier.getKind().getId(),
                kindName,
                dossier.isEnabled(),
                items
        );
    }

    @Transactional
    public FalleroeffnungResponse createFallInAkte(Long akteId, CreateFallInAkteRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        KindDossier dossier = dossierRepo.findById(akteId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte not found"));

        CreateFalleroeffnungRequest create = new CreateFalleroeffnungRequest(
                dossier.getKind().getId(),
                SecurityUtils.currentOrgUnitIdRequired(), // ✅ einrichtungOrgUnitId
                null,                                    // teamOrgUnitId
                (req != null && req.titel() != null && !req.titel().isBlank())
                        ? req.titel()
                        : ("Fall für " + dossier.getKind().getVorname() + " " + dossier.getKind().getNachname()).trim(),
                req != null ? req.kurzbeschreibung() : null,
                List.of()
        );

        return fallService.create(create);
    }
}