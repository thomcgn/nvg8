package org.thomcgn.backend.people.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.people.dto.CreateKindRequest;
import org.thomcgn.backend.people.dto.KindResponse;
import org.thomcgn.backend.people.model.Gender;
import org.thomcgn.backend.people.model.Kind;
import org.thomcgn.backend.people.repo.KindRepository;

@Service
public class KindService {

    private final KindRepository repo;
    private final AccessControlService access;

    public KindService(KindRepository repo, AccessControlService access) {
        this.repo = repo;
        this.access = access;
    }

    @Transactional
    public KindResponse create(CreateKindRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Kind k = new Kind();
        k.setVorname(req.vorname());
        k.setNachname(req.nachname());
        k.setGeburtsdatum(req.geburtsdatum());

        Gender g = Gender.UNBEKANNT;
        if (req.gender() != null && !req.gender().isBlank()) {
            try { g = Gender.valueOf(req.gender().trim()); }
            catch (Exception e) { throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown gender: " + req.gender()); }
        }
        k.setGender(g);

        k.setFoerderbedarf(req.foerderbedarf());
        k.setFoerderbedarfDetails(req.foerderbedarfDetails());
        k.setGesundheitsHinweise(req.gesundheitsHinweise());

        Kind saved = repo.save(k);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public KindResponse get(Long id) {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Kind k = repo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Kind not found"));
        return toDto(k);
    }

    private KindResponse toDto(Kind k) {
        return new KindResponse(
                k.getId(),
                k.getVorname(),
                k.getNachname(),
                k.getGeburtsdatum(),
                k.getGender() != null ? k.getGender().name() : Gender.UNBEKANNT.name(),
                k.isFoerderbedarf(),
                k.getFoerderbedarfDetails(),
                k.getGesundheitsHinweise()
        );
    }
}