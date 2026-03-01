package org.thomcgn.backend.falloeffnungen.risk.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thomcgn.backend.auth.model.Role;
import org.thomcgn.backend.auth.service.AccessControlService;
import org.thomcgn.backend.common.errors.DomainException;
import org.thomcgn.backend.common.errors.ErrorCode;
import org.thomcgn.backend.common.security.SecurityUtils;
import org.thomcgn.backend.falloeffnungen.model.Falleroeffnung;
import org.thomcgn.backend.falloeffnungen.repo.FalleroeffnungRepository;
import org.thomcgn.backend.falloeffnungen.risk.dto.RiskSnapshotResponse;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungNotizTag;
import org.thomcgn.backend.falloeffnungen.risk.model.FalleroeffnungRiskSnapshot;
import org.thomcgn.backend.falloeffnungen.risk.model.TraegerRiskMatrixConfig;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungNotizTagRepository;
import org.thomcgn.backend.falloeffnungen.risk.repo.FalleroeffnungRiskSnapshotRepository;
import org.thomcgn.backend.falloeffnungen.risk.repo.TraegerRiskMatrixConfigRepository;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class FallRiskService {

    private final FalleroeffnungRepository fallRepo;
    private final FalleroeffnungNotizTagRepository tagRepo;
    private final TraegerRiskMatrixConfigRepository configRepo;
    private final FalleroeffnungRiskSnapshotRepository snapshotRepo;
    private final AccessControlService access;
    private final ObjectMapper objectMapper;

    public FallRiskService(
            FalleroeffnungRepository fallRepo,
            FalleroeffnungNotizTagRepository tagRepo,
            TraegerRiskMatrixConfigRepository configRepo,
            FalleroeffnungRiskSnapshotRepository snapshotRepo,
            AccessControlService access,
            ObjectMapper objectMapper
    ) {
        this.fallRepo = fallRepo;
        this.tagRepo = tagRepo;
        this.configRepo = configRepo;
        this.snapshotRepo = snapshotRepo;
        this.access = access;
        this.objectMapper = objectMapper;
    }

    // ---------------------------------------------------------
    // Public API
    // ---------------------------------------------------------

    @Transactional
    public RiskSnapshotResponse recomputeAndSnapshot(Long fallId) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        Falleroeffnung f = fallRepo.findByIdWithRefsScoped(fallId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        TraegerRiskMatrixConfig cfg = configRepo.findActiveByTraegerId(tid).orElse(null);

        RiskMatrixConfig parsed = cfg != null ? parseConfig(cfg.getConfigJson()) : defaultConfig();

        List<FalleroeffnungNotizTag> tags = tagRepo.findAllTagsByFallId(fallId);

        Evaluation eval = evaluate(parsed, tags);

        FalleroeffnungRiskSnapshot s = new FalleroeffnungRiskSnapshot();
        s.setFalleroeffnung(f);
        s.setConfig(cfg);
        s.setConfigVersion(cfg != null ? cfg.getVersion() : parsed.meta.version);
        s.setRawScore(BigDecimal.valueOf(round1(eval.rawScore)));
        s.setProtectiveReduction(BigDecimal.valueOf(round1(eval.protectiveReduction)));
        s.setFinalScore(BigDecimal.valueOf(round1(eval.finalScore)));
        s.setTrafficLight(eval.trafficLight);

        try {
            s.setRationaleJson(objectMapper.writeValueAsString(eval.rationale));
            s.setHardHitsJson(objectMapper.writeValueAsString(eval.hardRuleHits));
            s.setDimensionsJson(objectMapper.writeValueAsString(eval.dimensionsPresent));
        } catch (Exception e) {
            // Fallback: not fatal
            s.setRationaleJson("[\"JSON serialization failed\"]");
            s.setHardHitsJson("[]");
            s.setDimensionsJson("[]");
        }

        FalleroeffnungRiskSnapshot saved = snapshotRepo.save(s);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RiskSnapshotResponse latest(Long fallId) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        Falleroeffnung f = fallRepo.findByIdWithRefsScoped(fallId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return snapshotRepo.findLatest(fallId).map(this::toResponse).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<RiskSnapshotResponse> history(Long fallId) {
        Long tid = SecurityUtils.currentTraegerIdRequired();
        Long oid = SecurityUtils.currentOrgUnitIdRequired();

        Falleroeffnung f = fallRepo.findByIdWithRefsScoped(fallId, tid, oid)
                .orElseThrow(() -> DomainException.notFound(ErrorCode.NOT_FOUND, "Falleröffnung not found"));

        access.requireAccessToEinrichtungObject(
                f.getTraeger().getId(),
                f.getEinrichtungOrgUnit().getId(),
                Role.LESEN, Role.FACHKRAFT, Role.TEAMLEITUNG, Role.EINRICHTUNG_ADMIN, Role.TRAEGER_ADMIN
        );

        return snapshotRepo.findHistory(fallId).stream().map(this::toResponse).toList();
    }

    // ---------------------------------------------------------
    // Internal: Config + Evaluation
    // ---------------------------------------------------------

    private RiskSnapshotResponse toResponse(FalleroeffnungRiskSnapshot s) {
        return new RiskSnapshotResponse(
                s.getId(),
                s.getFalleroeffnung().getId(),
                s.getConfig() != null ? s.getConfig().getId() : null,
                s.getConfigVersion(),
                s.getRawScore(),
                s.getProtectiveReduction(),
                s.getFinalScore(),
                s.getTrafficLight(),
                s.getRationaleJson(),
                s.getHardHitsJson(),
                s.getDimensionsJson(),
                s.getCreatedAt()
        );
    }

    private double round1(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    // SeverityFactor: 0 -> 0.0, 1 -> 0.5, 2 -> 1.0, 3 -> 1.5
    private double severityFactor(int s) {
        if (s <= 0) return 0.0;
        if (s == 1) return 0.5;
        if (s == 2) return 1.0;
        return 1.5;
    }

    private Evaluation evaluate(RiskMatrixConfig cfg, List<FalleroeffnungNotizTag> tags) {
        // Aggregate indicator severities: pro indicatorId MAX severity (robust)
        Map<String, Integer> maxSeverityByIndicator = new HashMap<>();
        for (FalleroeffnungNotizTag t : tags) {
            if (t.getIndicatorId() == null || t.getIndicatorId().isBlank()) continue;
            Integer sev = t.getSeverity();
            if (sev == null) continue;
            int s = Math.max(0, Math.min(3, sev));
            maxSeverityByIndicator.merge(t.getIndicatorId().trim(), s, Math::max);
        }

        // Dimensions present
        Set<String> dimsPresent = new HashSet<>();
        int presentCount = 0;
        List<Map<String, Object>> hardHits = new ArrayList<>();

        double raw = 0.0;

        // Evaluate indicators from config
        for (Indicator ind : cfg.indicators) {
            int s = maxSeverityByIndicator.getOrDefault(ind.id, 0);

            boolean isPresent = s > 0 && s >= ind.presentAtSeverity;
            if (isPresent) {
                presentCount += 1;
                dimsPresent.add(ind.dimension);
            }

            // hard rule
            if (ind.hardRule != null && s >= ind.hardRule.atOrAbove) {
                Map<String, Object> hit = new LinkedHashMap<>();
                hit.put("indicatorId", ind.id);
                hit.put("label", ind.hardRule.label);
                hardHits.add(hit);
            }

            double dimMul = cfg.dimensionMultiplier.getOrDefault(ind.dimension, 1.0);
            raw += ind.weight * severityFactor(s) * dimMul;
        }

        // Protective factors: (optional) – aktuell nicht aus Tags, sondern nur config-seitig
        // Wenn ihr Schutzfaktoren auch als Notiz-Tags abbilden wollt, könnt ihr analog weitere Tag-Typen einführen.
        double reduction = 0.0;
        // capped
        reduction = Math.min(reduction, cfg.protectiveCapMaxReduction);

        double finalScore = Math.max(0.0, round1(raw - reduction));

        // Determine traffic light
        String traffic;
        List<String> rationale = new ArrayList<>();

        if (!hardHits.isEmpty()) {
            traffic = "ROT";
            rationale.add("Mindestens eine harte Regel wurde ausgelöst.");
        } else if (dimsPresent.size() >= cfg.multiDimensionMinForRed) {
            traffic = "ROT";
            rationale.add("Mehrdimensionale Hinweise (" + dimsPresent.size() + ") ≥ " + cfg.multiDimensionMinForRed + ".");
        } else {
            if (finalScore <= cfg.greenMax) {
                traffic = "GRUEN";
                rationale.add("Score ≤ " + cfg.greenMax + ".");
            } else if (finalScore <= cfg.yellowMax) {
                traffic = "GELB";
                rationale.add("Score zwischen " + (cfg.greenMax + 0.1) + " und " + cfg.yellowMax + ".");
            } else {
                traffic = "ROT";
                rationale.add("Score > " + cfg.yellowMax + ".");
            }

            if (presentCount >= cfg.volumeMinIndicatorsForYellow && "GRUEN".equals(traffic)) {
                traffic = "GELB";
                rationale.add("Viele Hinweise (" + presentCount + ") ≥ " + cfg.volumeMinIndicatorsForYellow + " → mindestens GELB.");
            }
        }

        if (cfg.meta != null && cfg.meta.supportOnly) {
            rationale.add("Hinweis: Die Ampel ist Entscheidungsunterstützung (keine automatische Entscheidung).");
        }

        // Unknown indicators referenced in tags (optional warn)
        Set<String> knownIndicatorIds = cfg.indicators.stream().map(i -> i.id).collect(Collectors.toSet());
        List<String> unknown = maxSeverityByIndicator.keySet().stream()
                .filter(id -> !knownIndicatorIds.contains(id))
                .sorted()
                .toList();
        if (!unknown.isEmpty()) {
            rationale.add("Warnung: Unbekannte Indikator-IDs in Tags (werden ignoriert): " + String.join(", ", unknown));
        }

        Evaluation e = new Evaluation();
        e.rawScore = round1(raw);
        e.protectiveReduction = round1(reduction);
        e.finalScore = finalScore;
        e.trafficLight = traffic;
        e.rationale = rationale;
        e.hardRuleHits = hardHits;
        e.dimensionsPresent = dimsPresent.stream().sorted().toList();
        return e;
    }

    private RiskMatrixConfig parseConfig(String json) {
        try {
            return objectMapper.readValue(json, RiskMatrixConfig.class);
        } catch (Exception e) {
            throw DomainException.badRequest(ErrorCode.VALIDATION_FAILED, "Invalid risk matrix config JSON: " + e.getMessage());
        }
    }

    private RiskMatrixConfig defaultConfig() {
        // Minimal default; Traeger sollte via UI/Config-API aktiv konfigurieren.
        RiskMatrixConfig c = new RiskMatrixConfig();
        c.meta = new Meta();
        c.meta.version = "default";
        c.meta.supportOnly = true;

        c.greenMax = 12.0;
        c.yellowMax = 24.0;

        c.multiDimensionMinForRed = 3;
        c.volumeMinIndicatorsForYellow = 4;
        c.protectiveCapMaxReduction = 12.0;

        c.dimensionMultiplier = new HashMap<>();
        c.dimensionMultiplier.put("körperlich", 1.2);
        c.dimensionMultiplier.put("psychisch", 1.0);
        c.dimensionMultiplier.put("vernachlässigung", 1.0);
        c.dimensionMultiplier.put("sexuell", 1.6);
        c.dimensionMultiplier.put("häuslicheGewalt", 1.2);
        c.dimensionMultiplier.put("selbstgefährdung", 1.4);
        c.dimensionMultiplier.put("schulabsentismus", 0.8);
        c.dimensionMultiplier.put("kontext", 0.7);

        c.indicators = new ArrayList<>();

        c.indicators.add(ind("injury_unexplained", "Unerklärte / widersprüchlich erklärte Verletzungen", "körperlich", 6, 2, null));
        c.indicators.add(indHard("injury_severe", "Schwere Verletzung / akuter medizinischer Handlungsbedarf", "körperlich", 8, 2, 2, "Schwere Verletzung → Rot (akuter Abklärungs-/Schutzbedarf)"));
        c.indicators.add(indHard("fear_of_home", "Kind äußert Angst vor Heimkehr / bestimmter Bezugsperson", "psychisch", 7, 2, 3, "Konkrete Angst vor Heimkehr (stark) → Rot"));
        c.indicators.add(ind("humiliation_threats", "Demütigung, Drohungen, massive Einschüchterung", "psychisch", 6, 2, null));
        c.indicators.add(ind("neglect_basic", "Deutliche Hinweise auf Vernachlässigung (Hygiene, Hunger, Kleidung)", "vernachlässigung", 5, 2, null));
        c.indicators.add(indHard("supervision_absent", "Fehlende Aufsicht (Kind wiederholt allein/gefährdend unbeaufsichtigt)", "vernachlässigung", 7, 2, 3, "Fehlende Aufsicht (stark) → Rot"));
        c.indicators.add(indHard("sexualized_behavior", "Altersuntypisch sexualisiertes Verhalten / Hinweise auf sexualisierte Gewalt", "sexuell", 8, 1, 2, "Hinweise sexualisierte Gewalt (deutlich) → Rot"));
        c.indicators.add(ind("domestic_violence", "Hinweise auf häusliche Gewalt im Haushalt", "häuslicheGewalt", 6, 2, null));
        c.indicators.add(indHard("self_harm", "Selbstverletzung / Suizidäußerungen", "selbstgefährdung", 8, 1, 2, "Konkrete Selbstgefährdung → Rot"));
        c.indicators.add(ind("school_absence", "Wiederholter unentschuldigter Schulabsentismus", "schulabsentismus", 3, 2, null));
        c.indicators.add(ind("police_callouts", "Polizeieinsätze / eskalierte Konflikte im Umfeld", "kontext", 4, 2, null));

        return c;
    }

    private Indicator ind(String id, String title, String dim, double weight, int presentAt, HardRule rule) {
        Indicator i = new Indicator();
        i.id = id;
        i.title = title;
        i.dimension = dim;
        i.weight = weight;
        i.presentAtSeverity = presentAt;
        i.hardRule = rule;
        return i;
    }

    private Indicator indHard(String id, String title, String dim, double weight, int presentAt, int atOrAbove, String label) {
        HardRule r = new HardRule();
        r.atOrAbove = atOrAbove;
        r.label = label;
        return ind(id, title, dim, weight, presentAt, r);
    }

    // ---------------------------------------------------------
    // Config model (JSON-mapped)
    // ---------------------------------------------------------

    public static class RiskMatrixConfig {
        public Meta meta;
        public double greenMax;
        public double yellowMax;
        public Map<String, Double> dimensionMultiplier;
        public int multiDimensionMinForRed;
        public int volumeMinIndicatorsForYellow;
        public double protectiveCapMaxReduction;
        public List<Indicator> indicators;
    }

    public static class Meta {
        public String version;
        public boolean supportOnly;
    }

    public static class Indicator {
        public String id;
        public String title;
        public String dimension;
        public double weight;
        public int presentAtSeverity;
        public HardRule hardRule;
    }

    public static class HardRule {
        public int atOrAbove;
        public String label;
    }

    // ---------------------------------------------------------
    // Evaluation model (internal)
    // ---------------------------------------------------------

    private static class Evaluation {
        double rawScore;
        double protectiveReduction;
        double finalScore;
        String trafficLight;
        List<String> rationale;
        List<Map<String, Object>> hardRuleHits;
        List<String> dimensionsPresent;
    }
}