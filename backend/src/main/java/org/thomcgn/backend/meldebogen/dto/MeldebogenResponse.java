package org.thomcgn.backend.meldebogen.dto;

import java.time.Instant;
import java.time.LocalDate;

public record MeldebogenResponse(
        Long id,
        Long falloeffnungId,
        LocalDate eingangsdatum,
        String erfassendeFachkraft,
        String meldungart,
        String melderName,
        String melderKontakt,
        String melderBeziehungKind,
        String melderGlaubwuerdigkeit,
        String schilderung,
        String kindAktuellerAufenthalt,
        boolean belastungKoerperlErkrankung,
        boolean belastungPsychErkrankung,
        boolean belastungSucht,
        boolean belastungHaeuslicheGewalt,
        boolean belastungSuizidgefahr,
        boolean belastungGewalttaetigeErz,
        boolean belastungSozialeIsolation,
        String belastungSonstiges,
        String ersteinschaetzung,
        String handlungsdringlichkeit,
        String ersteinschaetzungFreitext,
        String createdByDisplayName,
        Instant createdAt,
        Instant updatedAt
) {}
