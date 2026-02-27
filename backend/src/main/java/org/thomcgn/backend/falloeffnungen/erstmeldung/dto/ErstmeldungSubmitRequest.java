package org.thomcgn.backend.falloeffnungen.erstmeldung.dto;

public record ErstmeldungSubmitRequest(
        boolean mirrorObservationsToNotizen,
        boolean recomputeRisk
) {}