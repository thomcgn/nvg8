package org.thomcgn.backend.kinderschutz.model;

import java.time.LocalDate;
import java.time.Period;

public enum Altersgruppe {

    ALTER_0_3("0 bis 3 Jahre"),
    ALTER_3_6("3 bis 6 Jahre"),
    ALTER_6_14("6 bis 14 Jahre"),
    ALTER_14_18("14 bis 18 Jahre");

    private final String label;

    Altersgruppe(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static Altersgruppe berechnen(LocalDate geburtsdatum, LocalDate bewertungsdatum) {
        int alter = Period.between(geburtsdatum, bewertungsdatum).getYears();
        if (alter < 3) return ALTER_0_3;
        if (alter < 6) return ALTER_3_6;
        if (alter < 14) return ALTER_6_14;
        return ALTER_14_18;
    }
}
