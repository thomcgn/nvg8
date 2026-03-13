package org.thomcgn.backend.meldebogen.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.meldebogen.dto.MeldebogenListItemResponse;
import org.thomcgn.backend.meldebogen.dto.MeldebogenRequest;
import org.thomcgn.backend.meldebogen.dto.MeldebogenResponse;
import org.thomcgn.backend.meldebogen.model.Meldebogen;
import org.thomcgn.backend.meldebogen.repo.MeldebogenRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class MeldebogenService {

    private final MeldebogenRepository repo;
    private final FalleroeffnungRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    public MeldebogenService(MeldebogenRepository repo,
                              FalleroeffnungRepository fallRepo,
                              UserRepository userRepo,
                              AccessControlService access) {
        this.repo     = repo;
        this.fallRepo = fallRepo;
        this.userRepo = userRepo;
        this.access   = access;
    }

    @Transactional(readOnly = true)
    public List<MeldebogenListItemResponse> list(Long falloeffnungId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        return repo.findByFalloeffnungScoped(falloeffnungId, traegerId, einrichtungId)
                .stream().map(this::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public MeldebogenResponse get(Long falloeffnungId, Long id) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        Meldebogen m = repo.findByIdScoped(id, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Meldebogen nicht gefunden."));
        return toResponse(m);
    }

    @Transactional
    public MeldebogenResponse create(Long falloeffnungId, MeldebogenRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        Meldebogen m = new Meldebogen();
        applyRequest(m, req, fall);
        m.setCreatedBy(userRepo.getReferenceById(SecurityUtils.currentUserId()));
        repo.save(m);
        return toResponse(m);
    }

    @Transactional
    public MeldebogenResponse update(Long falloeffnungId, Long id, MeldebogenRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        Meldebogen m = repo.findByIdScoped(id, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Meldebogen nicht gefunden."));
        applyRequest(m, req, fall);
        return toResponse(m);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Falleroeffnung ladeFallScoped(Long falloeffnungId, Long traegerId, Long einrichtungId) {
        return fallRepo.findByIdWithRefsScoped(falloeffnungId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fallöffnung nicht gefunden."));
    }

    private void applyRequest(Meldebogen m, MeldebogenRequest req, Falleroeffnung fall) {
        m.setFalloeffnung(fall);
        m.setTraeger(fall.getTraeger());
        m.setEinrichtungOrgUnit(fall.getEinrichtungOrgUnit());
        m.setEingangsdatum(req.eingangsdatum());
        m.setErfassendeFachkraft(req.erfassendeFachkraft());
        m.setMeldungart(req.meldungart());
        m.setMelderName(req.melderName());
        m.setMelderKontakt(req.melderKontakt());
        m.setMelderBeziehungKind(req.melderBeziehungKind());
        m.setMelderGlaubwuerdigkeit(req.melderGlaubwuerdigkeit());
        m.setSchilderung(req.schilderung());
        m.setKindAktuellerAufenthalt(req.kindAktuellerAufenthalt());
        m.setBelastungKoerperlErkrankung(req.belastungKoerperlErkrankung());
        m.setBelastungPsychErkrankung(req.belastungPsychErkrankung());
        m.setBelastungSucht(req.belastungSucht());
        m.setBelastungHaeuslicheGewalt(req.belastungHaeuslicheGewalt());
        m.setBelastungSuizidgefahr(req.belastungSuizidgefahr());
        m.setBelastungGewalttaetigeErz(req.belastungGewalttaetigeErz());
        m.setBelastungSozialeIsolation(req.belastungSozialeIsolation());
        m.setBelastungSonstiges(req.belastungSonstiges());
        m.setErsteinschaetzung(req.ersteinschaetzung());
        m.setHandlungsdringlichkeit(req.handlungsdringlichkeit());
        m.setErsteinschaetzungFreitext(req.ersteinschaetzungFreitext());
    }

    private MeldebogenResponse toResponse(Meldebogen m) {
        return new MeldebogenResponse(
                m.getId(), m.getFalloeffnung().getId(),
                m.getEingangsdatum(), m.getErfassendeFachkraft(),
                m.getMeldungart(), m.getMelderName(), m.getMelderKontakt(),
                m.getMelderBeziehungKind(), m.getMelderGlaubwuerdigkeit(),
                m.getSchilderung(), m.getKindAktuellerAufenthalt(),
                m.isBelastungKoerperlErkrankung(), m.isBelastungPsychErkrankung(),
                m.isBelastungSucht(), m.isBelastungHaeuslicheGewalt(),
                m.isBelastungSuizidgefahr(), m.isBelastungGewalttaetigeErz(),
                m.isBelastungSozialeIsolation(), m.getBelastungSonstiges(),
                m.getErsteinschaetzung(), m.getHandlungsdringlichkeit(),
                m.getErsteinschaetzungFreitext(),
                m.getCreatedBy().getDisplayName(), m.getCreatedAt(), m.getUpdatedAt()
        );
    }

    private MeldebogenListItemResponse toListItem(Meldebogen m) {
        return new MeldebogenListItemResponse(
                m.getId(), m.getFalloeffnung().getId(),
                m.getEingangsdatum(), m.getMeldungart(),
                m.getErsteinschaetzung(), m.getHandlungsdringlichkeit(),
                m.getCreatedBy().getDisplayName(), m.getCreatedAt()
        );
    }
}
