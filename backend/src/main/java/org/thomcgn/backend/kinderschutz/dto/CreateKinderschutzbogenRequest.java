package org.thomcgn.backend.kinderschutz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record CreateKinderschutzbogenRequest(
        @NotNull LocalDate bewertungsdatum,
        @Valid List<BewertungRequest> bewertungen,
        Short gesamteinschaetzungManuell,
        String gesamteinschaetzungFreitext
) {}
