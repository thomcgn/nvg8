package org.thomcgn.backend.schutzplan.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record SchutzplanResponse(
        Long id,
        Long falloeffnungId,
        LocalDate erstelltAm,
        LocalDate gueltigBis,
        String status,
        String gefaehrdungssituation,
        String vereinbarungen,
        String beteiligte,
        LocalDate naechsterTermin,
        String gesamtfreitext,
        List<MassnahmeResponse> massnahmen,
        String createdByDisplayName,
        Instant createdAt,
        Instant updatedAt
) {}
