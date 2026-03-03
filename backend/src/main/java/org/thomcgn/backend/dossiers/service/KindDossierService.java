package org.thomcgn.backend.dossiers.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.dossiers.dto.*;
import org.thomcgn.backend.dossiers.model.KindDossier;
import org.thomcgn.backend.dossiers.repo.KindDossierRepository;
import org.thomcgn.backend.falloeffnungen.dto.CreateFalleroeffnungRequest;
import org.thomcgn.backend.falloeffnungen.dto.FalleroeffnungResponse;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.service.FalleroeffnungService;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.people.repo.KindRepository;

@Service
public class KindDossierService {

    private final KindDossierRepository dossierRepo;
    private final KindRepository kindRepo;
    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungService fallService;
    private final OrgUnitRepository orgUnitRepository;

    public KindDossierService(
            KindDossierRepository dossierRepo,
            KindRepository kindRepo,
            FalleroeffnungRepository fallRepo,
            FalleroeffnungService fallService,
            OrgUnitRepository orgUnitRepository
    ) {
        this.dossierRepo = dossierRepo;
        this.kindRepo = kindRepo;
        this.fallRepo = fallRepo;
        this.fallService = fallService;
        this.orgUnitRepository = orgUnitRepository;
    }

    private static String kindNameOf(Kind k) {
        if (k == null) return null;
        String fn = k.getVorname() == null ? "" : k.getVorname();
        String ln = k.getNachname() == null ? "" : k.getNachname();
        String n = (fn + " " + ln).trim();
        return n.isBlank() ? null : n;
    }

    @Transactional(readOnly = true)
    public AkteDto getAkte(Long akteId) {
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        KindDossier d = dossierRepo.findByIdScopedWithKind(akteId, einrichtungOrgUnitId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte nicht gefunden"));

        String createdAt = d.getCreatedAt() == null ? null : d.getCreatedAt().toString();
        return new AkteDto(d.getId(), d.getKind().getId(), kindNameOf(d.getKind()), createdAt);
    }

    @Transactional(readOnly = true)
    public AkteDto getAkteByKind(Long kindId) {
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        KindDossier d = dossierRepo.findByEinrichtungOrgUnit_IdAndKind_Id(einrichtungOrgUnitId, kindId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Akte nicht gefunden"));

        String createdAt = d.getCreatedAt() == null ? null : d.getCreatedAt().toString();
        return new AkteDto(d.getId(), d.getKind().getId(), kindNameOf(d.getKind()), createdAt);
    }


    @Transactional
    public AkteDto resolveOrCreateAkteForKind(Long kindId) {
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        return dossierRepo.findByEinrichtungOrgUnit_IdAndKind_Id(einrichtungOrgUnitId, kindId)
                .map(d -> {
                    String createdAt = d.getCreatedAt() == null ? null : d.getCreatedAt().toString();
                    return new AkteDto(d.getId(), d.getKind().getId(), kindNameOf(d.getKind()), createdAt);
                })
                .orElseGet(() -> {
                    Kind k = kindRepo.findById(kindId)
                            .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind nicht gefunden"));

                    OrgUnit einrichtung = orgUnitRepository.findById(einrichtungOrgUnitId)
                            .orElseThrow(() -> DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Einrichtungs-Kontext ungültig"));

                    if (einrichtung.getTraeger() == null) {
                        throw DomainException.conflict(ErrorCode.CONFLICT, "Einrichtung hat keinen Träger");
                    }

                    KindDossier d = new KindDossier();
                    d.setEinrichtungOrgUnit(einrichtung);
                    d.setTraeger(einrichtung.getTraeger()); // ✅ wichtig wegen NOT NULL traeger_id
                    d.setKind(k);
                    d.setEnabled(true);

                    d = dossierRepo.save(d);

                    String createdAt = d.getCreatedAt() == null ? null : d.getCreatedAt().toString();
                    return new AkteDto(d.getId(), k.getId(), kindNameOf(k), createdAt);
                });
    }

    @Transactional
    public AkteDto createAkte(CreateAkteRequest req) {
        return resolveOrCreateAkteForKind(req.kindId());
    }

    @Transactional(readOnly = true)
    public AkteListResponse list(String q, int page, int size) {
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        var p = dossierRepo.listAkten(
                einrichtungOrgUnitId,
                (q == null || q.isBlank()) ? null : q.trim(),
                PageRequest.of(page, size)
        );

        var items = p.getContent().stream().map(r -> {
            String fn = r.getVorname() == null ? "" : r.getVorname();
            String ln = r.getNachname() == null ? "" : r.getNachname();
            String kindName = (fn + " " + ln).trim();
            if (kindName.isBlank()) kindName = null;

            String createdAt = r.getCreatedAt() == null ? null : r.getCreatedAt().toString();
            String lastFallAt = r.getLastFallAt() == null ? null : r.getLastFallAt().toString();

            return new AkteListItemDto(
                    r.getId(),
                    r.getKindId(),
                    kindName,
                    createdAt,
                    lastFallAt,
                    r.getFallCount()
            );
        }).toList();

        return new AkteListResponse(items, p.getTotalElements(), page, size);
    }

    @Transactional(readOnly = true)
    public FallListResponse listFaelle(Long akteId, int page, int size) {
        // scope-check (Einrichtung)
        getAkte(akteId);

        Page<Falleroeffnung> p = fallRepo.findByDossier_IdOrderByOpenedAtDesc(akteId, PageRequest.of(page, size));
        var items = p.getContent().stream().map(f -> new FallListItemDto(
                f.getId(),
                f.getFallNo(),
                f.getAktenzeichen(),
                f.getStatus() == null ? null : f.getStatus().name(),
                f.getOpenedAt() == null ? null : f.getOpenedAt().toString(),
                f.getCreatedAt() == null ? null : f.getCreatedAt().toString()
        )).toList();

        return new FallListResponse(items, p.getTotalElements());
    }


    @Transactional
    public CreateFallInAkteResponse createFall(Long akteId, CreateFallInAkteRequest req) {
        AkteDto akte = getAkte(akteId); // scope-check: Akte muss in aktiver Einrichtung liegen
        Long einrichtungOrgUnitId = SecurityUtils.currentOrgUnitIdRequired();

        CreateFalleroeffnungRequest create = new CreateFalleroeffnungRequest(
                akte.kindId(),
                einrichtungOrgUnitId,   // ✅ aus Context, nicht aus Request
                req.teamOrgUnitId(),
                req.titel(),
                req.kurzbeschreibung(),
                req.anlassCodes()
        );

        FalleroeffnungResponse created = fallService.create(create);
        return new CreateFallInAkteResponse(created.id());
    }
}