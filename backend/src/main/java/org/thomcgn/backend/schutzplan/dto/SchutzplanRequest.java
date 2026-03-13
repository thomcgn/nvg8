package org.thomcgn.backend.schutzplan.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record SchutzplanRequest(
        @NotNull LocalDate erstelltAm,
        LocalDate gueltigBis,
        String status,
        String gefaehrdungssituation,
        String vereinbarungen,
        String beteiligte,
        LocalDate naechsterTermin,
        String gesamtfreitext,
        @Valid List<MassnahmeRequest> massnahmen
) {}
