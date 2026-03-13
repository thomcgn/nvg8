package org.thomcgn.backend.dji.model;

import java.util.List;

/**
 * Formular-Typen der DJI-Prüfbögen nach §8a SGB VIII.
 * Quelle: Kindler et al. (Hrsg.), Handbuch Kindeswohlgefährdung nach §1666 BGB,
 * Deutsches Jugendinstitut, 2006.
 */
public enum DjiFormTyp {

    SICHERHEITSEINSCHAETZUNG(
            "Sicherheitseinschätzung",
            "Prüfung auf akuten Handlungsbedarf – wird nach jedem Kontakt ausgefüllt.",
            List.of(
                    new GesamtOption("KEIN_AKUTER_HANDLUNGSBEDARF", "Kein akuter Handlungsbedarf"),
                    new GesamtOption("HANDLUNGSBEDARF_BALD",        "Handlungsbedarf – zeitnah"),
                    new GesamtOption("HANDLUNGSBEDARF_SOFORT",      "Handlungsbedarf – sofort")
            )
    ),

    RISIKOEINSCHAETZUNG(
            "Risikoeinschätzung",
            "Einschätzung des mittel- und längerfristigen Misshandlungs- und Vernachlässigungsrisikos.",
            List.of(
                    new GesamtOption("KEIN_RISIKO",      "Kein Risiko"),
                    new GesamtOption("GERINGES_RISIKO",  "Geringes Risiko"),
                    new GesamtOption("ERHOEHTES_RISIKO", "Erhöhtes Risiko"),
                    new GesamtOption("HOHES_RISIKO",     "Hohes Risiko")
            )
    ),

    ERZIEHUNGSFAEHIGKEIT_PFLEGE(
            "Erziehungsfähigkeit – Pflege und Versorgung",
            "Einschätzung der elterlichen Pflege- und Versorgungsleistung.",
            List.of(
                    new GesamtOption("AUSREICHEND",        "Ausreichend"),
                    new GesamtOption("EINGESCHRAENKT",     "Eingeschränkt – unterstützungsbedürftig"),
                    new GesamtOption("NICHT_AUSREICHEND",  "Nicht ausreichend – Kindeswohlgefährdung")
            )
    ),

    ERZIEHUNGSFAEHIGKEIT_BINDUNG(
            "Erziehungsfähigkeit – Bindung",
            "Einschätzung der Bindungsqualität und Feinfühligkeit der Bezugsperson.",
            List.of(
                    new GesamtOption("AUSREICHEND",        "Ausreichend"),
                    new GesamtOption("EINGESCHRAENKT",     "Eingeschränkt – unterstützungsbedürftig"),
                    new GesamtOption("NICHT_AUSREICHEND",  "Nicht ausreichend – Kindeswohlgefährdung")
            )
    ),

    ERZIEHUNGSFAEHIGKEIT_REGELN(
            "Erziehungsfähigkeit – Regeln und Werte",
            "Einschätzung der Fähigkeit, dem Kind Regeln und Werte zu vermitteln.",
            List.of(
                    new GesamtOption("AUSREICHEND",        "Ausreichend"),
                    new GesamtOption("EINGESCHRAENKT",     "Eingeschränkt – unterstützungsbedürftig"),
                    new GesamtOption("NICHT_AUSREICHEND",  "Nicht ausreichend – Kindeswohlgefährdung")
            )
    ),

    ERZIEHUNGSFAEHIGKEIT_FOERDERUNG(
            "Erziehungsfähigkeit – Förderung",
            "Einschätzung der elterlichen Förderungsleistung und Stimulationsqualität.",
            List.of(
                    new GesamtOption("AUSREICHEND",        "Ausreichend"),
                    new GesamtOption("EINGESCHRAENKT",     "Eingeschränkt – unterstützungsbedürftig"),
                    new GesamtOption("NICHT_AUSREICHEND",  "Nicht ausreichend – Kindeswohlgefährdung")
            )
    ),

    BEDUERFNIS_SCHEMA(
            "Einordnungsschema kindliche Bedürfnisse",
            "Sechsstufige Bewertung der Erfüllung kindlicher Grundbedürfnisse.",
            List.of()
    ),

    FOERDERUNGSBEDARF(
            "Förderungsbedarf des Kindes",
            "Einschätzung von Entwicklungsdefiziten und Unterstützungsbedarf des Kindes.",
            List.of()
    ),

    RESSOURCEN_KIND(
            "Ressourcen des Kindes",
            "Dokumentation von Stärken und Schutzfaktoren des Kindes.",
            List.of()
    ),

    VERAENDERUNGSBEREITSCHAFT(
            "Veränderungsbereitschaft der Eltern",
            "Einschätzung der Veränderungsfähigkeit und Kooperationsbereitschaft der Eltern.",
            List.of(
                    new GesamtOption("AUSREICHEND",        "Ausreichend vorhanden"),
                    new GesamtOption("EINGESCHRAENKT",     "Eingeschränkt vorhanden"),
                    new GesamtOption("GERING_BIS_FEHLEND", "Gering bis fehlend")
            )
    );

    private final String label;
    private final String beschreibung;
    private final List<GesamtOption> gesamteinschaetzungOptionen;

    DjiFormTyp(String label, String beschreibung, List<GesamtOption> gesamteinschaetzungOptionen) {
        this.label = label;
        this.beschreibung = beschreibung;
        this.gesamteinschaetzungOptionen = gesamteinschaetzungOptionen;
    }

    public String getLabel() { return label; }
    public String getBeschreibung() { return beschreibung; }
    public List<GesamtOption> getGesamteinschaetzungOptionen() { return gesamteinschaetzungOptionen; }

    public boolean istGueltigeGesamteinschaetzung(String wert) {
        if (wert == null) return true;
        return gesamteinschaetzungOptionen.stream().anyMatch(o -> o.code().equals(wert));
    }

    public record GesamtOption(String code, String label) {}
}
