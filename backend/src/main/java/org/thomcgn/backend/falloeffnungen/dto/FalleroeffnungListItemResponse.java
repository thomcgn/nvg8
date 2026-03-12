package org.thomcgn.backend.falloeffnungen.dto;

import java.time.Instant;
import java.time.LocalDate;

public record FalleroeffnungListItemResponse(
        Long id,
        String status,
        String titel,
        String aktenzeichen,

        Long dossierId,
        Long kindId,
        String kindName,

        Long einrichtungOrgUnitId,
        Long teamOrgUnitId,

        String createdByDisplayName,
        Instant createdAt,

        // ✅ Neu für Dashboard: aus current Meldung abgeleitet (falls vorhanden)
        Boolean akutGefahrImVerzug,
        String dringlichkeit,
        LocalDate naechsteUeberpruefungAm
) {}