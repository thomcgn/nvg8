package org.thomcgn.backend.schutzplan.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.schutzplan.dto.*;
import org.thomcgn.backend.schutzplan.model.Schutzplan;
import org.thomcgn.backend.schutzplan.model.SchutzplanMassnahme;
import org.thomcgn.backend.schutzplan.repo.SchutzplanMassnahmeRepository;
import org.thomcgn.backend.schutzplan.repo.SchutzplanRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.ArrayList;
import java.util.List;

@Service
public class SchutzplanService {

    private final SchutzplanRepository repo;
    private final SchutzplanMassnahmeRepository massnahmeRepo;
    private final FalleroeffnungRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    public SchutzplanService(SchutzplanRepository repo,
                              SchutzplanMassnahmeRepository massnahmeRepo,
                              FalleroeffnungRepository fallRepo,
                              UserRepository userRepo,
                              AccessControlService access) {
        this.repo          = repo;
        this.massnahmeRepo = massnahmeRepo;
        this.fallRepo      = fallRepo;
        this.userRepo      = userRepo;
        this.access        = access;
    }

    @Transactional(readOnly = true)
    public List<SchutzplanListItemResponse> list(Long falloeffnungId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        return repo.findByFalloeffnungScoped(falloeffnungId, traegerId, einrichtungId)
                .stream().map(s -> {
                    int count = massnahmeRepo.findBySchutzplan_IdOrderByPosition(s.getId()).size();
                    return toListItem(s, count);
                }).toList();
    }

    @Transactional(readOnly = true)
    public SchutzplanResponse get(Long falloeffnungId, Long id) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        Schutzplan s = repo.findByIdScoped(id, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Schutzplan nicht gefunden."));
        List<SchutzplanMassnahme> massnahmen = massnahmeRepo.findBySchutzplan_IdOrderByPosition(id);
        return toResponse(s, massnahmen);
    }

    @Transactional
    public SchutzplanResponse create(Long falloeffnungId, SchutzplanRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        Schutzplan s = new Schutzplan();
        applyRequest(s, req, fall);
        s.setCreatedBy(userRepo.getReferenceById(SecurityUtils.currentUserId()));
        repo.save(s);

        List<SchutzplanMassnahme> massnahmen = speichereMassnahmen(s, req.massnahmen());
        return toResponse(s, massnahmen);
    }

    @Transactional
    public SchutzplanResponse update(Long falloeffnungId, Long id, SchutzplanRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        Schutzplan s = repo.findByIdScoped(id, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Schutzplan nicht gefunden."));
        applyRequest(s, req, fall);
        massnahmeRepo.deleteBySchutzplanId(id);
        List<SchutzplanMassnahme> massnahmen = speichereMassnahmen(s, req.massnahmen());
        return toResponse(s, massnahmen);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Falleroeffnung ladeFallScoped(Long falloeffnungId, Long traegerId, Long einrichtungId) {
        return fallRepo.findByIdWithRefsScoped(falloeffnungId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fallöffnung nicht gefunden."));
    }

    private void applyRequest(Schutzplan s, SchutzplanRequest req, Falleroeffnung fall) {
        s.setFalloeffnung(fall);
        s.setTraeger(fall.getTraeger());
        s.setEinrichtungOrgUnit(fall.getEinrichtungOrgUnit());
        s.setErstelltAm(req.erstelltAm());
        s.setGueltigBis(req.gueltigBis());
        s.setStatus(req.status() != null ? req.status() : "AKTIV");
        s.setGefaehrdungssituation(req.gefaehrdungssituation());
        s.setVereinbarungen(req.vereinbarungen());
        s.setBeteiligte(req.beteiligte());
        s.setNaechsterTermin(req.naechsterTermin());
        s.setGesamtfreitext(req.gesamtfreitext());
    }

    private List<SchutzplanMassnahme> speichereMassnahmen(Schutzplan s, List<MassnahmeRequest> requests) {
        if (requests == null || requests.isEmpty()) return List.of();
        List<SchutzplanMassnahme> result = new ArrayList<>();
        short pos = 1;
        for (MassnahmeRequest req : requests) {
            SchutzplanMassnahme m = new SchutzplanMassnahme();
            m.setSchutzplan(s);
            m.setPosition(pos++);
            m.setMassnahme(req.massnahme());
            m.setVerantwortlich(req.verantwortlich());
            m.setBisDatum(req.bisDatum());
            m.setStatus(req.status() != null ? req.status() : "OFFEN");
            result.add(massnahmeRepo.save(m));
        }
        return result;
    }

    private SchutzplanResponse toResponse(Schutzplan s, List<SchutzplanMassnahme> massnahmen) {
        List<MassnahmeResponse> mList = massnahmen.stream()
                .map(m -> new MassnahmeResponse(m.getId(), m.getPosition(),
                        m.getMassnahme(), m.getVerantwortlich(), m.getBisDatum(), m.getStatus()))
                .toList();
        return new SchutzplanResponse(
                s.getId(), s.getFalloeffnung().getId(),
                s.getErstelltAm(), s.getGueltigBis(), s.getStatus(),
                s.getGefaehrdungssituation(), s.getVereinbarungen(), s.getBeteiligte(),
                s.getNaechsterTermin(), s.getGesamtfreitext(), mList,
                s.getCreatedBy().getDisplayName(), s.getCreatedAt(), s.getUpdatedAt()
        );
    }

    private SchutzplanListItemResponse toListItem(Schutzplan s, int anzahl) {
        return new SchutzplanListItemResponse(
                s.getId(), s.getFalloeffnung().getId(),
                s.getErstelltAm(), s.getGueltigBis(), s.getStatus(), anzahl,
                s.getCreatedBy().getDisplayName(), s.getCreatedAt()
        );
    }
}
