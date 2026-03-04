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
import org.thomcgn.backend.people.dto.*;
import org.thomcgn.backend.people.model.Bezugsperson;
import org.thomcgn.backend.people.model.Gender;
import org.thomcgn.backend.people.repo.BezugspersonRepository;
import org.thomcgn.backend.people.repo.KindBezugspersonRepository;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BezugspersonService {

    private final BezugspersonRepository repo;
    private final KindBezugspersonRepository kindBezugRepo;
    private final AccessControlService access;

    public BezugspersonService(BezugspersonRepository repo, KindBezugspersonRepository kindBezugRepo, AccessControlService access) {
        this.repo = repo;
        this.kindBezugRepo = kindBezugRepo;
        this.access = access;
    }

    // ---------------------------------------------------------
    // CREATE (Entity) – wird von KindService genutzt
    // ---------------------------------------------------------
    @Transactional
    public Bezugsperson createEntity(CreateBezugspersonRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (req == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "request required");
        }

        Bezugsperson b = new Bezugsperson();
        b.setTraegerId(SecurityUtils.currentTraegerIdRequired());

        Long ownerEinrichtung = access.activeEinrichtungId();
        if (ownerEinrichtung == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "No active Einrichtung in context.");
        }
        b.setOwnerEinrichtungOrgUnitId(ownerEinrichtung);

        b.setVorname(req.vorname());
        b.setNachname(req.nachname());
        b.setGeburtsdatum(req.geburtsdatum());
        b.setGender(req.gender() != null ? req.gender() : Gender.UNBEKANNT);

        b.setTelefon(req.telefon());
        b.setKontaktEmail(req.kontaktEmail());

        b.setStrasse(req.strasse());
        b.setHausnummer(req.hausnummer());
        b.setPlz(req.plz());
        b.setOrt(req.ort());

        return repo.save(b);
    }

    // ---------------------------------------------------------
    // SEARCH (Wizard + Liste)
    //
    // OPTIMIERUNG:
    // - Seite Bezugspersonen paged laden
    // - dann NUR für diese IDs Kinder in EINEM Query als Projection (BpKindRow) holen
    // - gruppieren in Map<bpId, List<KindMini>>
    // -> kein N+1, kein JOIN-FETCH Paging-Problem
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public BezugspersonSearchResponse search(String q, int page, int size, Long einrichtungIdOrNull) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        int safePage = Math.max(0, page);
        int safeSize = Math.min(100, Math.max(1, size));
        Pageable pageable = PageRequest.of(safePage, safeSize);

        Page<Bezugsperson> res;
        if (einrichtungIdOrNull != null) {
            res = repo.searchByTraegerAndEinrichtung(traegerId, einrichtungIdOrNull, q, pageable);
        } else {
            res = repo.searchByTraeger(traegerId, q, pageable);
        }

        List<Bezugsperson> bps = res.getContent();
        if (bps.isEmpty()) {
            return new BezugspersonSearchResponse(
                    List.of(),
                    res.getTotalElements(),
                    safePage,
                    safeSize
            );
        }

        // IDs der aktuellen Seite
        List<Long> bpIds = bps.stream()
                .map(Bezugsperson::getId)
                .filter(Objects::nonNull)
                .toList();

        // 🔥 OPTIMIERUNG #1: keine mutable Map + kein "not effectively final" Problem
        // 🔥 OPTIMIERUNG #2: Projection (BpKindRow) ist bereits "nur benötigte Spalten"
        final Map<Long, List<KindMini>> kinderByBpId =
                bpIds.isEmpty()
                        ? Map.of()
                        : kindBezugRepo.findActiveKinderForBezugspersonen(bpIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                BpKindRow::bezugspersonId,
                                // LinkedHashMap ist optional; hilft wenn dein Repo-Query ein order by hat
                                LinkedHashMap::new,
                                Collectors.mapping(
                                        r -> new KindMini(r.kindId(), r.kindVorname(),r.kindNachname(), r.kindGeburtsdatum()),
                                        Collectors.toList()
                                )
                        ));

        // DTOs bauen
        List<BezugspersonListItem> items = bps.stream()
                .map(bp -> toListItem(bp, kinderByBpId.getOrDefault(bp.getId(), List.of())))
                .toList();

        return new BezugspersonSearchResponse(
                items,
                res.getTotalElements(),
                safePage,
                safeSize
        );
    }

    // ---------------------------------------------------------
    // GET
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public BezugspersonResponse get(Long id) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Bezugsperson b = repo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Bezugsperson not found"));

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        if (!traegerId.equals(b.getTraegerId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No access.");
        }

        return toDto(b);
    }

    // ---------------------------------------------------------
    // Mapping
    // ---------------------------------------------------------
    private BezugspersonListItem toListItem(Bezugsperson b, List<KindMini> kinder) {
        return new BezugspersonListItem(
                b.getId(),
                b.getDisplayName(),
                b.getGeburtsdatum(),
                b.getTelefon(),
                b.getKontaktEmail(),
                kinder
        );
    }

    private BezugspersonResponse toDto(Bezugsperson b) {
        return new BezugspersonResponse(
                b.getId(),
                b.getVorname(),
                b.getNachname(),
                b.getGeburtsdatum(),
                b.getGender(),
                b.getTelefon(),
                b.getKontaktEmail(),
                b.getStrasse(),
                b.getHausnummer(),
                b.getPlz(),
                b.getOrt(),
                null
        );
    }

    // ---------------------------------------------------------
    // DUPLICATES (Name+Nachname+Geburtsdatum)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public BezugspersonDuplicateResponse findDuplicates(String vorname, String nachname, LocalDate geburtsdatum, Long einrichtungId) {
        // einrichtungId wird hier aktuell NICHT verwendet, weil dein Bezugsperson-Model offenbar
        // kein bp.einrichtung-Feld hat (du hattest bereits UnknownPathException).
        // Wenn du später pro Einrichtung filtern willst: bitte über ownerEinrichtungOrgUnitId o.ä.
        var hits = repo.findDuplicates(vorname.trim(), nachname.trim(), geburtsdatum);

        var items = hits.stream()
                .limit(10)
                .map(bp -> new DuplicateItem(
                        bp.getId(),
                        bp.getDisplayName(),
                        bp.getGeburtsdatum()
                ))
                .toList();

        return new BezugspersonDuplicateResponse(items);
    }
}