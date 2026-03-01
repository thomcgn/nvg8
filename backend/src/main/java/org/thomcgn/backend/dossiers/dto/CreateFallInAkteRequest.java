package org.thomcgn.backend.dossiers.dto;

public record CreateFallInAkteRequest(
        String titel,
        String kurzbeschreibung
) {}