package org.thomcgn.backend.hausbesuch.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.hausbesuch.dto.HausbesuchListItemResponse;
import org.thomcgn.backend.hausbesuch.dto.HausbesuchRequest;
import org.thomcgn.backend.hausbesuch.dto.HausbesuchResponse;
import org.thomcgn.backend.hausbesuch.model.Hausbesuch;
import org.thomcgn.backend.hausbesuch.repo.HausbesuchRepository;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class HausbesuchService {

    private final HausbesuchRepository repo;
    private final FalleroeffnungRepository fallRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    public HausbesuchService(HausbesuchRepository repo,
                              FalleroeffnungRepository fallRepo,
                              UserRepository userRepo,
                              AccessControlService access) {
        this.repo     = repo;
        this.fallRepo = fallRepo;
        this.userRepo = userRepo;
        this.access   = access;
    }

    @Transactional(readOnly = true)
    public List<HausbesuchListItemResponse> list(Long falloeffnungId) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        return repo.findByFalloeffnungScoped(falloeffnungId, traegerId, einrichtungId)
                .stream().map(this::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public HausbesuchResponse get(Long falloeffnungId, Long id) {
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        Hausbesuch h = repo.findByIdScoped(id, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Hausbesuch nicht gefunden."));
        return toResponse(h);
    }

    @Transactional
    public HausbesuchResponse create(Long falloeffnungId, HausbesuchRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);

        Hausbesuch h = new Hausbesuch();
        applyRequest(h, req, fall);
        h.setCreatedBy(userRepo.getReferenceById(SecurityUtils.currentUserId()));
        repo.save(h);
        return toResponse(h);
    }

    @Transactional
    public HausbesuchResponse update(Long falloeffnungId, Long id, HausbesuchRequest req) {
        access.requireAny(Role.FACHKRAFT, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        Long traegerId     = SecurityUtils.currentTraegerIdRequired();
        Long einrichtungId = access.activeEinrichtungId();
        Falleroeffnung fall = ladeFallScoped(falloeffnungId, traegerId, einrichtungId);
        Hausbesuch h = repo.findByIdScoped(id, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Hausbesuch nicht gefunden."));
        applyRequest(h, req, fall);
        return toResponse(h);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────────

    private Falleroeffnung ladeFallScoped(Long falloeffnungId, Long traegerId, Long einrichtungId) {
        return fallRepo.findByIdWithRefsScoped(falloeffnungId, traegerId, einrichtungId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fallöffnung nicht gefunden."));
    }

    private void applyRequest(Hausbesuch h, HausbesuchRequest req, Falleroeffnung fall) {
        h.setFalloeffnung(fall);
        h.setTraeger(fall.getTraeger());
        h.setEinrichtungOrgUnit(fall.getEinrichtungOrgUnit());
        h.setBesuchsdatum(req.besuchsdatum());
        h.setBesuchszeitVon(req.besuchszeitVon());
        h.setBesuchszeitBis(req.besuchszeitBis());
        h.setAnwesende(req.anwesende());
        h.setWhgOrdnung(req.whgOrdnung());
        h.setWhgHygiene(req.whgHygiene());
        h.setWhgNahrungsversorgung(req.whgNahrungsversorgung());
        h.setWhgUnfallgefahren(req.whgUnfallgefahren());
        h.setWhgSonstiges(req.whgSonstiges());
        h.setKindErscheinungsbild(req.kindErscheinungsbild());
        h.setKindVerhalten(req.kindVerhalten());
        h.setKindStimmung(req.kindStimmung());
        h.setKindAeusserungen(req.kindAeusserungen());
        h.setKindHinweiseGefaehrdung(req.kindHinweiseGefaehrdung());
        h.setBpErscheinungsbild(req.bpErscheinungsbild());
        h.setBpVerhalten(req.bpVerhalten());
        h.setBpUmgangKind(req.bpUmgangKind());
        h.setBpKooperation(req.bpKooperation());
        h.setEinschaetzungAmpel(req.einschaetzungAmpel());
        h.setEinschaetzungText(req.einschaetzungText());
        h.setNaechsteSchritte(req.naechsteSchritte());
        h.setNaechsterTermin(req.naechsterTermin());
    }

    private HausbesuchResponse toResponse(Hausbesuch h) {
        return new HausbesuchResponse(
                h.getId(), h.getFalloeffnung().getId(),
                h.getBesuchsdatum(), h.getBesuchszeitVon(), h.getBesuchszeitBis(),
                h.getAnwesende(),
                h.getWhgOrdnung(), h.getWhgHygiene(), h.getWhgNahrungsversorgung(),
                h.getWhgUnfallgefahren(), h.getWhgSonstiges(),
                h.getKindErscheinungsbild(), h.getKindVerhalten(), h.getKindStimmung(),
                h.getKindAeusserungen(), h.getKindHinweiseGefaehrdung(),
                h.getBpErscheinungsbild(), h.getBpVerhalten(), h.getBpUmgangKind(), h.getBpKooperation(),
                h.getEinschaetzungAmpel(), h.getEinschaetzungText(),
                h.getNaechsteSchritte(), h.getNaechsterTermin(),
                h.getCreatedBy().getDisplayName(), h.getCreatedAt(), h.getUpdatedAt()
        );
    }

    private HausbesuchListItemResponse toListItem(Hausbesuch h) {
        return new HausbesuchListItemResponse(
                h.getId(), h.getFalloeffnung().getId(),
                h.getBesuchsdatum(), h.getEinschaetzungAmpel(),
                h.getCreatedBy().getDisplayName(), h.getCreatedAt()
        );
    }
}
