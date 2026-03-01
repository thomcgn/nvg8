package org.thomcgn.backend.tenants.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.tenants.dto.*;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.model.TraegerRiskIndicator;
import org.thomcgn.backend.tenants.repo.TraegerRepository;
import org.thomcgn.backend.tenants.repo.TraegerRiskIndicatorRepository;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class TraegerRiskIndicatorService {

    private final TraegerRiskIndicatorRepository repo;
    private final TraegerRepository traegerRepo;
    private final AccessControlService access;

    public TraegerRiskIndicatorService(
            TraegerRiskIndicatorRepository repo,
            TraegerRepository traegerRepo,
            AccessControlService access
    ) {
        this.repo = repo;
        this.traegerRepo = traegerRepo;
        this.access = access;
    }

    // =======================
    // READ (any authenticated in traeger context)
    // =======================

    @Transactional(readOnly = true)
    public List<TraegerRiskIndicatorResponse> listForCurrentTraeger() {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        return repo.findAllByTraeger_IdOrderBySortOrderAscIdAsc(traegerId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TraegerRiskIndicatorResponse> adminList(Long traegerId) {
        access.requireAny(Role.TRAEGER_ADMIN);
        return repo.findAllByTraeger_IdOrderBySortOrderAscIdAsc(traegerId).stream()
                .map(this::toDto)
                .toList();
    }

    // =======================
    // ADMIN CRUD
    // =======================

    @Transactional
    public TraegerRiskIndicatorResponse adminCreate(Long traegerId, CreateTraegerRiskIndicatorRequest req) {
        access.requireAny(Role.TRAEGER_ADMIN);

        Traeger t = traegerRepo.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        String indicatorId = normalizeId(req.indicatorId());
        if (repo.findByTraeger_IdAndIndicatorId(traegerId, indicatorId).isPresent()) {
            throw DomainException.conflict(ErrorCode.CONFLICT, "indicatorId already exists for this traeger");
        }

        TraegerRiskIndicator tri = new TraegerRiskIndicator();
        tri.setTraeger(t);
        tri.setIndicatorId(indicatorId);
        tri.setLabel(req.label().trim());
        tri.setDescription(trimToNull(req.description()));
        tri.setCategory(trimToNull(req.category()));
        tri.setEnabled(req.enabled() == null || req.enabled());
        tri.setDefaultSeverity(normalizeSeverity(req.defaultSeverity()));

        int nextOrder = repo.maxSortOrder(traegerId) + 10;
        tri.setSortOrder(nextOrder);

        return toDto(repo.save(tri));
    }

    @Transactional
    public TraegerRiskIndicatorResponse adminUpdate(Long traegerId, Long id, UpdateTraegerRiskIndicatorRequest req) {
        access.requireAny(Role.TRAEGER_ADMIN);

        TraegerRiskIndicator tri = repo.findByTraeger_IdAndId(traegerId, id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "RiskIndicator not found"));

        if (req.indicatorId() != null && !req.indicatorId().isBlank()) {
            String newKey = normalizeId(req.indicatorId());
            Optional<TraegerRiskIndicator> existing = repo.findByTraeger_IdAndIndicatorId(traegerId, newKey);
            if (existing.isPresent() && !existing.get().getId().equals(tri.getId())) {
                throw DomainException.conflict(ErrorCode.CONFLICT, "indicatorId already exists for this traeger");
            }
            tri.setIndicatorId(newKey);
        }

        if (req.label() != null && !req.label().isBlank()) tri.setLabel(req.label().trim());
        if (req.description() != null) tri.setDescription(trimToNull(req.description()));
        if (req.category() != null) tri.setCategory(trimToNull(req.category()));
        if (req.enabled() != null) tri.setEnabled(req.enabled());
        if (req.defaultSeverity() != null) tri.setDefaultSeverity(normalizeSeverity(req.defaultSeverity()));

        return toDto(repo.save(tri));
    }

    @Transactional
    public void adminDelete(Long traegerId, Long id) {
        access.requireAny(Role.TRAEGER_ADMIN);

        TraegerRiskIndicator tri = repo.findByTraeger_IdAndId(traegerId, id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "RiskIndicator not found"));
        repo.delete(tri);
    }

    @Transactional
    public List<TraegerRiskIndicatorResponse> adminReorder(Long traegerId, ReorderTraegerRiskIndicatorsRequest req) {
        access.requireAny(Role.TRAEGER_ADMIN);

        List<TraegerRiskIndicator> all = repo.findAllByTraeger_IdOrderBySortOrderAscIdAsc(traegerId);
        Map<Long, TraegerRiskIndicator> byId = all.stream().collect(Collectors.toMap(TraegerRiskIndicator::getId, x -> x));

        List<Long> ordered = req.orderedIds();
        if (ordered.size() != byId.size()) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "orderedIds must contain all ids");
        }

        // ensure same set
        Set<Long> s1 = new HashSet<>(ordered);
        Set<Long> s2 = byId.keySet();
        if (!s1.equals(s2)) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "orderedIds must match exactly the existing ids");
        }

        int order = 10;
        for (Long id : ordered) {
            TraegerRiskIndicator tri = byId.get(id);
            tri.setSortOrder(order);
            order += 10;
        }

        repo.saveAll(byId.values());

        return repo.findAllByTraeger_IdOrderBySortOrderAscIdAsc(traegerId).stream()
                .map(this::toDto)
                .toList();
    }

    // =======================
    // Helpers
    // =======================

    private TraegerRiskIndicatorResponse toDto(TraegerRiskIndicator x) {
        return new TraegerRiskIndicatorResponse(
                x.getId(),
                x.getIndicatorId(),
                x.getLabel(),
                x.getDescription(),
                x.getCategory(),
                x.isEnabled(),
                x.getSortOrder(),
                x.getDefaultSeverity()
        );
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isBlank() ? null : t;
    }

    private String normalizeId(String raw) {
        String t = raw == null ? "" : raw.trim();
        if (t.isBlank()) throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "indicatorId is required");
        // normalize to upper snake-ish, but allow digits/underscore
        t = t.replace(" ", "_").toUpperCase(Locale.ROOT);
        t = t.replaceAll("[^A-Z0-9_\\-\\.]", "_");
        return t;
    }

    private Short normalizeSeverity(Integer s) {
        if (s == null) return null;
        int v = Math.max(0, Math.min(3, s));
        return (short) v;
    }
}