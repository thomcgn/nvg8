package org.thomcgn.backend.dossiers.dto;

import java.time.Instant;

public record DossierHistorySummary(
        long totalEpisodes,
        Instant lastClosedAt
) {}