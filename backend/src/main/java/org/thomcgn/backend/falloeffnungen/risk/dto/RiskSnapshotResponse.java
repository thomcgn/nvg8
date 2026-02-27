package org.thomcgn.backend.falloeffnungen.risk.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record RiskSnapshotResponse(
        Long id,
        Long falloeffnungId,
        Long configId,
        String configVersion,
        double rawScore,
        double protectiveReduction,
        BigDecimal finalScore,
        String trafficLight,       // GRUEN|GELB|ROT
        String rationaleJson,      // JSON-String (Frontend kann darstellen)
        String hardHitsJson,       // JSON-String
        String dimensionsJson,     // JSON-String
        Instant createdAt
) {}