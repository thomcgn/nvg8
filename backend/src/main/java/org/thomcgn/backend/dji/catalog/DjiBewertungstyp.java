package org.thomcgn.backend.dji.catalog;

/**
 * Art der Bewertung einer Position im DJI-Prüfbogen.
 */
public enum DjiBewertungstyp {
    /** Nur Freitextfeld für Belege – keine strukturierte Bewertung. */
    FREITEXT,

    /** Ja/Nein-Kriterium mit optionalem Belegetext (Sicherheitseinschätzung). */
    BOOLEAN_MIT_BELEGE,

    /** Sechsstufige Skala (0–5) mit optionalem Belegetext (Bedürfnis-Schema). */
    SECHSSTUFEN
}
