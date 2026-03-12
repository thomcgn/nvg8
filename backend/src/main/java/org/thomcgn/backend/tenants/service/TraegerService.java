package org.thomcgn.backend.tenants.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.orgunits.model.OrgUnit;
import org.thomcgn.backend.orgunits.model.OrgUnitType;
import org.thomcgn.backend.orgunits.repo.OrgUnitRepository;
import org.thomcgn.backend.tenants.dto.CreateTraegerRequest;
import org.thomcgn.backend.tenants.dto.TraegerResponse;
import org.thomcgn.backend.tenants.model.Traeger;
import org.thomcgn.backend.tenants.repo.TraegerRepository;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class TraegerService {

    private final TraegerRepository repo;
    private final AccessControlService access;
    private final OrgUnitRepository orgUnitRepository;

    public TraegerService(TraegerRepository repo,
                          AccessControlService access,
                          OrgUnitRepository orgUnitRepository) {
        this.repo = repo;
        this.access = access;
        this.orgUnitRepository = orgUnitRepository;
    }

    @Transactional
    public TraegerResponse create(CreateTraegerRequest req) {
        access.requireAny(Role.SYSTEM_ADMIN, Role.TRAEGER_ADMIN);

        String slug = generateSlug(req.name());
        // Eindeutigkeit sichern
        if (repo.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        Traeger t = new Traeger();
        t.setName(req.name().trim());
        t.setSlug(slug);
        t.setKurzcode(trim(req.kurzcode()));
        t.setAktenPrefix(req.aktenPrefix() != null && !req.aktenPrefix().isBlank()
                ? req.aktenPrefix().trim()
                : derivePrefix(req.name(), req.kurzcode()));
        t.setStrasse(trim(req.strasse()));
        t.setHausnummer(trim(req.hausnummer()));
        t.setPlz(trim(req.plz()));
        t.setOrt(trim(req.ort()));
        t.setLeitung(trim(req.leitung()));
        t.setAnsprechpartner(trim(req.ansprechpartner()));
        t.setEnabled(true);

        Traeger saved = repo.save(t);

        // Root-OrgUnit automatisch anlegen, damit der Baum sofort befüllt werden kann
        OrgUnit root = new OrgUnit();
        root.setTraeger(saved);
        root.setType(OrgUnitType.TRAEGER);
        root.setName(saved.getName());
        root.setEnabled(true);
        orgUnitRepository.save(root);

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public TraegerResponse get(Long id) {
        access.requireAny(Role.TRAEGER_ADMIN);
        Traeger t = repo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));
        return toDto(t);
    }

    @Transactional(readOnly = true)
    public TraegerResponse getCurrent() {
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        Traeger t = repo.findById(traegerId)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));
        return toDto(t);
    }

    @Transactional(readOnly = true)
    public List<TraegerResponse> list() {
        access.requireAny(Role.SYSTEM_ADMIN, Role.TRAEGER_ADMIN);
        if (access.has(Role.SYSTEM_ADMIN)) {
            return repo.findAll().stream().map(this::toDto).toList();
        }
        // TRAEGER_ADMIN sieht nur seinen eigenen Träger
        Long traegerId = SecurityUtils.currentTraegerIdRequired();
        return repo.findById(traegerId).stream().map(this::toDto).toList();
    }

    @Transactional
    public TraegerResponse update(Long id, CreateTraegerRequest req) {
        access.requireAny(Role.TRAEGER_ADMIN);
        Traeger t = repo.findById(id)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.TRAEGER_NOT_FOUND, "Traeger not found"));

        t.setName(req.name().trim());
        if (req.kurzcode() != null)       t.setKurzcode(req.kurzcode().trim());
        if (req.aktenPrefix() != null)    t.setAktenPrefix(req.aktenPrefix().trim());
        t.setStrasse(trim(req.strasse()));
        t.setHausnummer(trim(req.hausnummer()));
        t.setPlz(trim(req.plz()));
        t.setOrt(trim(req.ort()));
        t.setLeitung(trim(req.leitung()));
        t.setAnsprechpartner(trim(req.ansprechpartner()));

        return toDto(repo.save(t));
    }

    // -------------------------------------------------------------------------

    private TraegerResponse toDto(Traeger t) {
        return new TraegerResponse(
                t.getId(), t.getName(), t.getKurzcode(), t.getAktenPrefix(), t.isEnabled(),
                t.getStrasse(), t.getHausnummer(), t.getPlz(), t.getOrt(),
                t.getLeitung(), t.getAnsprechpartner()
        );
    }

    private static String generateSlug(String name) {
        String normalized = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private static String derivePrefix(String name, String kurzcode) {
        if (kurzcode != null && !kurzcode.isBlank()) return kurzcode.trim().toUpperCase(Locale.ROOT);
        String slug = generateSlug(name);
        return slug.substring(0, Math.min(slug.length(), 8)).toUpperCase(Locale.ROOT);
    }

    private static String trim(String s) {
        if (s == null || s.isBlank()) return null;
        return s.trim();
    }
}
