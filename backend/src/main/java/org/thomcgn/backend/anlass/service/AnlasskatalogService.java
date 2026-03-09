package org.thomcgn.backend.anlass.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.anlass.dto.*;
import org.thomcgn.backend.anlass.model.AnlasskatalogEntry;
import org.thomcgn.backend.anlass.repo.AnlasskatalogRepository;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AnlasskatalogService {

    private final AnlasskatalogRepository repo;
    private final AccessControlService access;

    @Transactional(readOnly = true)
    public List<AnlasskatalogEntryResponse> listAll() {
        return repo.findAllByOrderByCategoryAscLabelAsc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AnlasskatalogSimilarResponse findSimilar(String label, String code) {
        // Check exact code match
        boolean exactMatch = code != null && !code.isBlank() && repo.existsByCode(normalize(code));

        // Find similar by label terms (split on spaces and check each word ≥ 4 chars)
        List<AnlasskatalogEntryResponse> similar = List.of();
        if (label != null && !label.isBlank()) {
            // Use longest word (≥4 chars) for search
            String term = java.util.Arrays.stream(label.trim().split("\\s+"))
                    .filter(w -> w.length() >= 4)
                    .max(java.util.Comparator.comparingInt(String::length))
                    .orElse(label.trim());
            similar = repo.findSimilarByLabel(term).stream().map(this::toDto).toList();
        }

        return new AnlasskatalogSimilarResponse(exactMatch, similar);
    }

    @Transactional
    public AnlasskatalogEntryResponse create(CreateAnlasskatalogEntryRequest req) {
        access.requireAny(Role.TRAEGER_ADMIN);

        if (req.code() == null || req.code().isBlank())
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "code is required");
        if (req.label() == null || req.label().isBlank())
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "label is required");

        String code = normalize(req.code());
        if (repo.existsByCode(code))
            throw DomainException.conflict(ErrorCode.CONFLICT, "Code already exists: " + code);

        AnlasskatalogEntry e = new AnlasskatalogEntry();
        e.setCode(code);
        e.setLabel(req.label().trim());
        e.setCategory(req.category() != null ? req.category().trim() : null);
        e.setDefaultSeverity(req.defaultSeverity() != null
                ? (short) Math.max(0, Math.min(3, req.defaultSeverity()))
                : null);

        return toDto(repo.save(e));
    }

    private String normalize(String raw) {
        return raw.trim().replace(" ", "_").toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9_\\-]", "_");
    }

    private AnlasskatalogEntryResponse toDto(AnlasskatalogEntry e) {
        return new AnlasskatalogEntryResponse(
                e.getId(),
                e.getCode(),
                e.getLabel(),
                e.getCategory(),
                e.getDefaultSeverity() != null ? (int) e.getDefaultSeverity() : null
        );
    }
}
