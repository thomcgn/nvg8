package org.thomcgn.backend.kinderschutz.dto;

import java.time.Instant;
import java.time.LocalDate;

public record KinderschutzbogenListItemResponse(
        Long id,
        Long falloeffnungId,
        String altersgruppe,
        String altergruppeLabel,
        LocalDate bewertungsdatum,
        Double gesamteinschaetzungAuto,
        Short gesamteinschaetzungManuell,
        String createdByDisplayName,
        Instant createdAt
) {}
