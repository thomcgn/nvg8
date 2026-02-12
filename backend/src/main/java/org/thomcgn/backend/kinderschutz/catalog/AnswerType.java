package org.thomcgn.backend.kinderschutz.catalog;

public enum AnswerType {
    TRI_STATE,   // Ja / Nein / keine Angaben möglich
    TEXT,        // Freitext (z.B. Anlass, Zeitraum, Anmerkungenblock)
    DATE,        // Datum
    USER_REF,    // Fachkraft (User)
    KIND_REF     // Kind-Referenz (meist brauchst du das nicht im Bogen, weil es im Fall hängt)
}
