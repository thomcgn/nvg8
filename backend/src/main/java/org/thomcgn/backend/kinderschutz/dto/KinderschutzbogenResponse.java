package org.thomcgn.backend.kinderschutz.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record KinderschutzbogenResponse(
        Long id,
        Long falloeffnungId,
        String altersgruppe,
        String altergruppeLabel,
        LocalDate bewertungsdatum,
        List<BewertungResponse> bewertungen,
        Double gesamteinschaetzungAuto,
        Short gesamteinschaetzungManuell,
        String gesamteinschaetzungFreitext,
        String createdByDisplayName,
        Instant createdAt,
        Instant updatedAt
) {}
