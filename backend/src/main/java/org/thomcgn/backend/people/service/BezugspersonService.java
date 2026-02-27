package org.thomcgn.backend.people.service;

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

import java.util.List;

@Service
public class BezugspersonService {

    private final BezugspersonRepository repo;
    private final AccessControlService access;

    public BezugspersonService(BezugspersonRepository repo, AccessControlService access) {
        this.repo = repo;
        this.access = access;
    }

    @Transactional
    public BezugspersonResponse create(CreateBezugspersonRequest req) {
        Bezugsperson bp = createEntity(req);
        return toDto(bp);
    }

    @Transactional
    public Bezugsperson createEntity(CreateBezugspersonRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (req == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "create request required");
        }

        Bezugsperson bp = new Bezugsperson();

        bp.setTraegerId(SecurityUtils.currentTraegerIdRequired());

        Long ownerEinrichtungId = access.activeEinrichtungId();
        if (ownerEinrichtungId == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "No active Einrichtung in context.");
        }
        bp.setOwnerEinrichtungOrgUnitId(ownerEinrichtungId);

        bp.setVorname(req.vorname());
        bp.setNachname(req.nachname());
        bp.setGeburtsdatum(req.geburtsdatum());
        bp.setGender(req.gender() != null ? req.gender() : Gender.UNBEKANNT);

        bp.setTelefon(req.telefon());
        bp.setKontaktEmail(req.kontaktEmail());

        bp.setStrasse(req.strasse());
        bp.setHausnummer(req.hausnummer());
        bp.setPlz(req.plz());
        bp.setOrt(req.ort());

        access.requireAccessToEinrichtungObject(
                bp.getTraegerId(),
                bp.getOwnerEinrichtungOrgUnitId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return repo.save(bp);
    }

    @Transactional(readOnly = true)
    public BezugspersonSearchResponse search(String q, int size) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        if (einrichtungId == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "No active Einrichtung in context.");
        }

        int safeSize = Math.min(50, Math.max(1, size));
        Pageable pageable = PageRequest.of(0, safeSize);

        List<Bezugsperson> res = repo.search(traegerId, einrichtungId, q, pageable);

        return new BezugspersonSearchResponse(
                res.stream()
                        .map(bp -> new BezugspersonListItem(
                                bp.getId(),
                                bp.getDisplayName(),
                                bp.getGeburtsdatum(),
                                bp.getTelefon(),
                                bp.getKontaktEmail()
                        ))
                        .toList()
        );
    }

    private BezugspersonResponse toDto(Bezugsperson bp) {
        return new BezugspersonResponse(
                bp.getId(),
                bp.getVorname(),
                bp.getNachname(),
                bp.getGeburtsdatum(),
                bp.getGender(),
                bp.getTelefon(),
                bp.getKontaktEmail(),
                bp.getStrasse(),
                bp.getHausnummer(),
                bp.getPlz(),
                bp.getOrt(),
                null
        );
    }
}