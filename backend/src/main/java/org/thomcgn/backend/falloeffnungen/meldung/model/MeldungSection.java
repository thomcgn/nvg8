package org.thomcgn.backend.falloeffnungen.meldung.model;

public enum MeldungSection {
    META,
    INHALT,
    FACH,
    AKUT,
    PLANUNG,
    ANLAESSE,
    OBSERVATIONS,
    JUGENDAMT,
    CONTACTS,
    EXTERN,
    ATTACHMENTS;

    public static MeldungSection valueOfSafe(String raw) {
        if (raw == null) return META;
        String s = raw.trim().toUpperCase();
        for (MeldungSection ms : values()) {
            if (ms.name().equals(s)) return ms;
        }
        return META;
    }
}