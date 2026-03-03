package org.thomcgn.backend.dossiers.repo;

import java.time.Instant;

public interface AkteListItemProjection {
    Long getId();
    Long getKindId();
    String getVorname();
    String getNachname();
    Instant getCreatedAt();
    Instant getLastFallAt();
    long getFallCount();
}