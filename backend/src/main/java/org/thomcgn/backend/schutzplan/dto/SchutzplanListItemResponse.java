package org.thomcgn.backend.schutzplan.dto;

import java.time.Instant;
import java.time.LocalDate;

public record SchutzplanListItemResponse(
        Long id,
        Long falloeffnungId,
        LocalDate erstelltAm,
        LocalDate gueltigBis,
        String status,
        int anzahlMassnahmen,
        String createdByDisplayName,
        Instant createdAt
) {}
