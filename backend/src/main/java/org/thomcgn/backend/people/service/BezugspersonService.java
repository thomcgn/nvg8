package org.thomcgn.backend.people.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.people.dto.CreateBezugspersonRequest;
import org.thomcgn.backend.people.dto.BezugspersonResponse;   // <- MUSS es geben, sonst siehe Hinweis unten
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

    /**
     * Für Controller/REST: gibt DTO zurück.
     */
    @Transactional
    public BezugspersonResponse create(CreateBezugspersonRequest req) {
        Bezugsperson bp = createEntity(req);
        return toDto(bp);
    }

    /**
     * Für interne Nutzung (z.B. KindService Link-Erstellung): gibt ENTITY zurück.
     */
    @Transactional
    public Bezugsperson createEntity(CreateBezugspersonRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        if (req == null) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "create request required");
        }

        Bezugsperson bp = new Bezugsperson();

        // Option A (Owner-Metadaten)
        bp.setTraegerId(SecurityUtils.currentTraegerIdRequired());

        Long ownerEinrichtungId = access.activeEinrichtungId();
        if (ownerEinrichtungId == null) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "No active Einrichtung in context.");
        }
        bp.setOwnerEinrichtungOrgUnitId(ownerEinrichtungId);

        // Personendaten
        bp.setVorname(req.vorname());
        bp.setNachname(req.nachname());
        bp.setGeburtsdatum(req.geburtsdatum());
        bp.setGender(req.gender() != null ? req.gender() : Gender.UNBEKANNT);

        // Kontakt
        bp.setTelefon(req.telefon());
        bp.setKontaktEmail(req.kontaktEmail());

        // Adresse
        bp.setStrasse(req.strasse());
        bp.setHausnummer(req.hausnummer());
        bp.setPlz(req.plz());
        bp.setOrt(req.ort());

        // Objektbasierter Check (Optional, aber konsistent zu Option A)
        access.requireAccessToEinrichtungObject(
                bp.getTraegerId(),
                bp.getOwnerEinrichtungOrgUnitId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return repo.save(bp);
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