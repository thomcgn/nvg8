package org.thomcgn.backend.falloeffnungen.risk.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.risk.dto.TraegerRiskMatrixConfigRequest;
import org.thomcgn.backend.falloeffnungen.risk.dto.TraegerRiskMatrixConfigResponse;
import org.thomcgn.backend.falloeffnungen.risk.model.TraegerRiskMatrixConfig;
import org.thomcgn.backend.falloeffnungen.risk.repo.TraegerRiskMatrixConfigRepository;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.users.model.User;
import org.thomcgn.backend.users.repo.UserRepository;

import java.util.List;

@Service
public class TraegerRiskMatrixConfigService {

    private final TraegerRiskMatrixConfigRepository repo;
    private final TraegerRepository traegerRepo;
    private final UserRepository userRepo;
    private final AccessControlService access;

    public TraegerRiskMatrixConfigService(
            TraegerRiskMatrixConfigRepository repo,
            TraegerRepository traegerRepo,
            UserRepository userRepo,
            AccessControlService access
    ) {
        this.repo = repo;
        this.traegerRepo = traegerRepo;
        this.userRepo = userRepo;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public TraegerRiskMatrixConfigResponse getActive() {
        access.requireAny(Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        TraegerRiskMatrixConfig c = repo.findActiveByTraegerId(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "No active config for traeger"));

        return toResponse(c);
    }

    @Transactional(readOnly = true)
    public List<TraegerRiskMatrixConfigResponse> history() {
        access.requireAny(Role.TRAEGER_ADMIN, Role.EINRICHTUNG_ADMIN, Role.TEAMLEITUNG);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        return repo.findAllByTraegerIdOrderByCreatedAtDesc(traegerId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public TraegerRiskMatrixConfigResponse create(TraegerRiskMatrixConfigRequest req) {
        access.requireAny(Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Long userId = SecurityUtils.currentUserId();

        Traeger traeger = traegerRepo.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        User creator = userRepo.findById(userId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.USER_NOT_FOUND, "User not found"));

        if (req.version() == null || req.version().isBlank()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "version is required");
        }
        if (req.configJson() == null || req.configJson().isBlank()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "configJson is required");
        }

        TraegerRiskMatrixConfig c = new TraegerRiskMatrixConfig();
        c.setTraeger(traeger);
        c.setVersion(req.version().trim());
        c.setConfigJson(req.configJson().trim());
        c.setActive(false);
        c.setCreatedBy(creator);

        TraegerRiskMatrixConfig saved = repo.save(c);

        if (req.active()) {
            activate(saved.getId());
            saved = repo.findById(saved.getId()).orElse(saved);
        }

        return toResponse(saved);
    }

    @Transactional
    public TraegerRiskMatrixConfigResponse activate(Long configId) {
        access.requireAny(Role.TRAEGER_ADMIN);

        Long traegerId = SecurityUtils.currentTraegerIdRequired();

        TraegerRiskMatrixConfig target = repo.findById(configId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Config not found"));

        if (!target.getTraeger().getId().equals(traegerId)) {
            throw DomainException.forbidden(ErrorCode.ACCESS_DENIED, "Cannot activate config for other traeger");
        }

        // Deactivate all
        repo.findAllByTraegerIdOrderByCreatedAtDesc(traegerId).forEach(c -> {
            if (c.isActive()) {
                c.setActive(false);
                repo.save(c);
            }
        });

        target.setActive(true);
        TraegerRiskMatrixConfig saved = repo.save(target);
        return toResponse(saved);
    }

    private TraegerRiskMatrixConfigResponse toResponse(TraegerRiskMatrixConfig c) {
        return new TraegerRiskMatrixConfigResponse(
                c.getId(),
                c.getTraeger().getId(),
                c.getVersion(),
                c.isActive(),
                c.getConfigJson(),
                c.getCreatedBy().getDisplayName(),
                c.getCreatedAt()
        );
    }
}