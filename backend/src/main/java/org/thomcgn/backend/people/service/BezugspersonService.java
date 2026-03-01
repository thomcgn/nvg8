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
import org.thomcgn.backend.people.dto.BezugspersonListItem;
import org.thomcgn.backend.people.dto.BezugspersonResponse;
import org.thomcgn.backend.people.dto.BezugspersonSearchResponse;
import org.thomcgn.backend.people.dto.CreateBezugspersonRequest;
import org.thomcgn.backend.people.model.Bezugsperson;
import org.thomcgn.backend.people.model.Gender;
import org.thomcgn.backend.people.repo.BezugspersonRepository;

@Service
public class BezugspersonService {

    private final BezugspersonRepository repo;
    private final AccessControlService access;

    public BezugspersonService(BezugspersonRepository repo, AccessControlService access) {
        this.repo = repo;
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
    // SEARCH (für Wizard Step "bestehende Bezugspersonen anhängen")
    // Default: pro Träger (alle)
    // Optional: per Einrichtung, falls du das willst (query param)
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

        return new BezugspersonSearchResponse(
                res.getContent().stream().map(this::toListItem).toList(),
                res.getTotalElements(),
                safePage,
                safeSize
        );
    }

    // ---------------------------------------------------------
    // GET (optional)
    // ---------------------------------------------------------
    @Transactional(readOnly = true)
    public BezugspersonResponse get(Long id) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Bezugsperson b = repo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Bezugsperson not found"));

        // Tenant-Check (minimal)
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        if (!traegerId.equals(b.getTraegerId())) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "No access.");
        }

        return toDto(b);
    }

    // ---------------------------------------------------------
    // Mapping
    // ---------------------------------------------------------
    private BezugspersonListItem toListItem(Bezugsperson b) {
        return new BezugspersonListItem(
                b.getId(),
                b.getDisplayName(),
                b.getGeburtsdatum(),
                b.getTelefon(),
                b.getKontaktEmail()
        );
    }

    private BezugspersonResponse toDto(Bezugsperson b) {
        // Bezug (beziehung) gehört NICHT in Bezugsperson, sondern in KindBezugsperson Link.
        // Deshalb hier null – Beziehung kommt aus KindBezugspersonResponse.
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
}