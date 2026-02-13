package org.thomcgn.backend.kinderschutz.forms.api.dto;

public record KSAnswerUpsertDTO(
        Long itemId,
        String value // TRI_STATE als String: "JA" | "NEIN" | "UNBEKANNT" (oder "UNKNOWN")
) {}