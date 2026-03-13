package org.thomcgn.backend.kinderschutz.catalog;

public enum SkbBereich {
    GRUNDVERSORGUNG_SCHUTZ("Grundversorgung und Schutz"),
    INTERAKTION("Interaktion Bezugsperson – Kind"),
    KOOPERATION("Kooperationsbereitschaft der Sorgeberechtigten"),
    ERSCHEINUNGSBILD("Erscheinungsbild des Jugendlichen");

    private final String label;

    SkbBereich(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
