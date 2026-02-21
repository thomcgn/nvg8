package org.thomcgn.backend.faelle.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.audit.model.AuditEventAction;
import org.thomcgn.backend.audit.service.AuditService;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.faelle.dto.*;
import org.thomcgn.backend.faelle.model.Fall;
import org.thomcgn.backend.faelle.model.FallNotiz;
import org.thomcgn.backend.faelle.model.FallStatus;
import org.thomcgn.backend.faelle.repo.FallNotizRepository;
import org.thomcgn.backend.faelle.repo.FallRepository;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;
import java.util.Set;

@Service
public class FallService {

    private final FallRepository fallRepository;
    private final FallNotizRepository notizRepository;
    private final TraegerRepository traegerRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final UserRepository userRepository;

    private final AccessControlService access;
    private final AuditService auditService;

    public FallService(
            FallRepository fallRepository,
            FallNotizRepository notizRepository,
            TraegerRepository traegerRepository,
            OrgUnitRepository orgUnitRepository,
            UserRepository userRepository,
            AccessControlService access,
            AuditService auditService
    ) {
        this.fallRepository = fallRepository;
        this.notizRepository = notizRepository;
        this.traegerRepository = traegerRepository;
        this.orgUnitRepository = orgUnitRepository;
        this.userRepository = userRepository;
        this.access = access;
        this.auditService = auditService;
    }

    // =========================================================
    // CREATE
    // =========================================================

    @Transactional
    public FallResponse create(CreateFallRequest req) {
        // Rollen: mindestens fachlich/admin
        access.requireAny(Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long userId = SecurityUtils.currentUserId();

        Traeger traeger = traegerRepository.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        OrgUnit einrichtung = orgUnitRepository.findById(req.einrichtungOrgUnitId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Einrichtung org unit not found"));

        // Zugriff: immer über Einrichtung (Owner-Scope)
        access.requireAccessToEinrichtungObject(
                traeger.getId(),
                einrichtung.getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        OrgUnit team = null;
        if (req.teamOrgUnitId() != null) {
            team = orgUnitRepository.findById(req.teamOrgUnitId())
                    .orElseThrow(() -> DomainException.notFound(ErrorCode.ORG_UNIT_NOT_FOUND, "Team org unit not found"));

            // Domänenregel: Team muss unter Einrichtung hängen
            access.requireTeamUnderEinrichtung(team.getId(), einrichtung.getId());
        }

        User creator = userRepository.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        Fall f = new Fall();
        f.setTraeger(traeger);
        f.setEinrichtungOrgUnit(einrichtung);
        f.setTeamOrgUnit(team);
        f.setStatus(FallStatus.OFFEN);
        f.setTitel(req.titel().trim());
        f.setKurzbeschreibung(req.kurzbeschreibung());
        f.setCreatedBy(creator);

        Fall saved = fallRepository.save(f);

        auditService.log(
                AuditEventAction.FALL_CREATED,
                "Fall",
                saved.getId(),
                saved.getEinrichtungOrgUnit().getId(),
                "Fall created: " + saved.getTitel()
        );

        return toResponse(saved, List.of());
    }

    // =========================================================
    // GET (inkl. Notizen)
    // =========================================================

    @Transactional(readOnly = true)
    public FallResponse get(Long fallId) {
        Fall fall = fallRepository.findByIdWithRefs(fallId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        // Leserechte: LESEN oder fachliche/admin Rollen
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        List<FallNotizResponse> notizen = notizRepository.findAllByFallId(fallId)
                .stream()
                .map(n -> new FallNotizResponse(
                        n.getId(),
                        n.getTyp(),
                        n.getText(),
                        n.getCreatedBy().getDisplayName(),
                        n.getCreatedAt()
                ))
                .toList();

        return toResponse(fall, notizen);
    }

    // =========================================================
    // LIST (kontextbasiert: aktive EINRICHTUNG)
    // =========================================================

    @Transactional(readOnly = true)
    public FallListResponse list(String status, String q, Pageable pageable) {
        // Mindestens Leserechte
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        // WICHTIG: multi-Einrichtung/multi-Träger wird über Kontextwechsel gelöst.
        // Deshalb listet das MVP nur Fälle der aktiven Einrichtung.
        Long activeEinrichtungId = access.activeEinrichtungId();
        if (activeEinrichtungId == null) {
            return new FallListResponse(List.of(), pageable.getPageNumber(), pageable.getPageSize(), 0);
        }

        FallStatus st = null;
        if (status != null && !status.isBlank()) {
            try {
                st = FallStatus.valueOf(status.trim());
            } catch (IllegalArgumentException ex) {
                throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + status);
            }
        }

        String query = (q == null || q.isBlank()) ? null : q.trim();

        Page<Fall> page = fallRepository.searchScoped(
                traegerId,
                Set.of(activeEinrichtungId),
                st,
                query,
                pageable
        );

        List<FallListItemResponse> items = page.getContent().stream()
                .map(f -> new FallListItemResponse(
                        f.getId(),
                        f.getStatus().name(),
                        f.getTitel(),
                        f.getEinrichtungOrgUnit().getId(),
                        f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                        f.getCreatedBy().getDisplayName(),
                        f.getCreatedAt()
                ))
                .toList();

        return new FallListResponse(items, page.getNumber(), page.getSize(), page.getTotalElements());
    }

    // =========================================================
    // ADD NOTE (append-only)
    // =========================================================

    @Transactional
    public FallNotizResponse addNotiz(Long fallId, AddNotizRequest req) {
        Fall fall = fallRepository.findByIdWithRefs(fallId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        if (fall.getStatus() == FallStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Fall is closed (read-only).");
        }

        // Schreibrechte
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.SCHREIBEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        User author = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        FallNotiz n = new FallNotiz();
        n.setFall(fall);
        n.setCreatedBy(author);
        n.setTyp(req.typ());
        n.setText(req.text().trim());

        FallNotiz saved = notizRepository.save(n);

        auditService.log(
                AuditEventAction.FALL_NOTE_ADDED,
                "Fall",
                fall.getId(),
                fall.getEinrichtungOrgUnit().getId(),
                "Note added" + (req.typ() != null ? " (" + req.typ() + ")" : "")
        );

        return new FallNotizResponse(
                saved.getId(),
                saved.getTyp(),
                saved.getText(),
                author.getDisplayName(),
                saved.getCreatedAt()
        );
    }

    // =========================================================
    // UPDATE STATUS
    // =========================================================

    @Transactional
    public FallResponse updateStatus(Long fallId, UpdateFallStatusRequest req) {
        Fall fall = fallRepository.findByIdWithRefs(fallId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Fall not found"));

        // Basiszugriff + fachliche Rolle
        access.requireAccessToEinrichtungObject(
                fall.getTraeger().getId(),
                fall.getEinrichtungOrgUnit().getId(),
                Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        FallStatus newStatus;
        try {
            newStatus = FallStatus.valueOf(req.status().trim());
        } catch (IllegalArgumentException ex) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Unknown status: " + req.status());
        }

        FallStatus oldStatus = fall.getStatus();

        if (oldStatus == FallStatus.ABGESCHLOSSEN) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Closed fall cannot change status.");
        }

        if (oldStatus == newStatus) {
            return get(fallId);
        }

        // MVP Transition rules
        if (newStatus == FallStatus.IN_PRUEFUNG && oldStatus != FallStatus.OFFEN) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Invalid status transition.");
        }

        // Closing requires elevated role
        if (newStatus == FallStatus.ABGESCHLOSSEN) {
            access.requireAny(Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);
        }

        fall.setStatus(newStatus);

        auditService.log(
                AuditEventAction.FALL_STATUS_CHANGED,
                "Fall",
                fall.getId(),
                fall.getEinrichtungOrgUnit().getId(),
                "Status changed from " + oldStatus + " to " + newStatus
        );

        return get(fallId);
    }

    // =========================================================
    // Mapper
    // =========================================================

    private FallResponse toResponse(Fall f, List<FallNotizResponse> notizen) {
        return new FallResponse(
                f.getId(),
                f.getStatus().name(),
                f.getTitel(),
                f.getKurzbeschreibung(),
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                f.getTeamOrgUnit() != null ? f.getTeamOrgUnit().getId() : null,
                f.getCreatedBy().getDisplayName(),
                notizen
        );
    }
}