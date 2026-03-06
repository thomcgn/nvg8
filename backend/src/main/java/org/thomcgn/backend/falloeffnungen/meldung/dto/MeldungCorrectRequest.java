package org.thomcgn.backend.falloeffnungen.meldung.dto;

import org.thomcgn.backend.falloeffnungen.meldung.model.MeldungChangeReason;

import java.time.Instant;

/**
 * Startet eine Korrektur als neuer Entwurf, vorbefüllt aus der Ziel-Meldung.
 */
public record MeldungCorrectRequest(
        Long targetMeldungId,

        // optional direkt setzen (kann auch später im Draft gespeichert werden)
        MeldungChangeReason changeReason,
        Instant infoEffectiveAt,
        String reasonText
) {}
