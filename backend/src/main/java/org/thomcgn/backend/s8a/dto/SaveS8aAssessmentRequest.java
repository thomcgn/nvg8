package org.thomcgn.backend.s8a.dto;

import java.util.List;

/**
 * Speichert eine neue Version der §8a-Einschätzung.
 *
 * Wichtig:
 * - Beteiligte sind strukturierte Participant-Objekte (keine Strings / kein JSON-Array)
 * - gefaehrdungsart kommt als String und wird serverseitig auf Enum gemappt
 */
public record SaveS8aAssessmentRequest(
        String gefaehrdungsart,
        List<S8aAssessmentParticipantDto> beteiligte,
        boolean kindesanhoerung,
        boolean iefkBeteiligt,
        boolean jugendamtInformiert
) {}