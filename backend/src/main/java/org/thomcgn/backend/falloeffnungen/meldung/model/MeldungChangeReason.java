package org.thomcgn.backend.falloeffnungen.meldung.model;

/**
 * Metadaten für eine neue Version.
 *
 * FIX = reine Korrektur (Fehler/Vertipper/Präzisierung) ohne neue Sachlage.
 * NACHTRAG = neue Information zum gleichen Sachverhalt (z.B. später am Tag Arzt/Mutter erreicht).
 * UPDATE = Sachlage hat sich geändert.
 * REASSESSMENT = fachliche Neubewertung / geänderte Einschätzung.
 */
public enum MeldungChangeReason {
    FIX,
    NACHTRAG,
    UPDATE,
    REASSESSMENT
}
