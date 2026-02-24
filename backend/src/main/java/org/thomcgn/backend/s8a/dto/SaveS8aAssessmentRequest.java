package org.thomcgn.backend.s8a.dto;

import java.util.List;

/**
 * Speichert eine neue Version der §8a-Einschätzung.
 *
 * Hinweis:
 * - gefaehrdungsart kommt als String, wird serverseitig auf Enum gemappt
 *   (so bleiben Clients flexibel, aber wir validieren strikt).
 */
public record SaveS8aAssessmentRequest(
        String gefaehrdungsart,
        List<String> beteiligte,
        boolean kindesanhoerung,
        boolean iefkBeteiligt,
        boolean jugendamtInformiert
) {}