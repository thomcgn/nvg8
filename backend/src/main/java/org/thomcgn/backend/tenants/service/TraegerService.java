package org.thomcgn.backend.tenants.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.tenants.dto.CreateTraegerRequest;
import org.thomcgn.backend.tenants.dto.TraegerResponse;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;

@Service
public class TraegerService {

    private final TraegerRepository repo;
    private final AccessControlService access;

    public TraegerService(TraegerRepository repo, AccessControlService access) {
        this.repo = repo;
        this.access = access;
    }

    @Transactional
    public TraegerResponse create(CreateTraegerRequest req) {
        // MVP: nur TRAEGER_ADMIN (oder SYSTEM_ADMIN, falls du hast)
        access.requireAny(Role.TRAEGER_ADMIN);

        Traeger t = new Traeger();
        t.setName(req.name().trim());
        if (req.kurzcode() != null) t.setKurzcode(req.kurzcode().trim());
        if (req.aktenPrefix() != null) t.setAktenPrefix(req.aktenPrefix().trim());
        t.setEnabled(true);

        Traeger saved = repo.save(t);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public TraegerResponse get(Long id) {
        Traeger t = repo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));
        access.requireAny(Role.TRAEGER_ADMIN);
        return toDto(t);
    }

    private TraegerResponse toDto(Traeger t) {
        return new TraegerResponse(t.getId(), t.getName(), t.getKurzcode(), t.getAktenPrefix(), t.isEnabled());
    }
}