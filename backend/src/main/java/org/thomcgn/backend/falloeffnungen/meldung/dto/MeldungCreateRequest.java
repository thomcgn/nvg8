package org.thomcgn.backend.falloeffnungen.meldung.dto;

public record MeldungCreateRequest(
        // optional: explizit “basiert auf” (sonst nimmt Service automatisch current/top)
        Long supersedesId
) {}