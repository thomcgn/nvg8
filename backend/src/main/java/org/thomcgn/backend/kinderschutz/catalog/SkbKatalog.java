package org.thomcgn.backend.kinderschutz.catalog;

import org.thomcgn.backend.kinderschutz.model.Altersgruppe;

import java.util.List;
import java.util.Map;

/**
 * Statischer Itemkatalog des Stuttgarter Kinderschutzbogens.
 *
 * Quelle: Orientierungskatalog Kinderschutzdiagnostik – Ankerbeispiele (Stand 12/2019),
 * Jugendämter Stuttgart und Düsseldorf.
 *
 * Bewertungsskala: -2 (sehr schlecht) | -1 (schlecht) | +1 (ausreichend) | +2 (gut)
 *
 * Achtung: Bestehende Item-Codes dürfen nicht umbenannt werden (Datenkontinuität).
 */
public class SkbKatalog {

    // ─── Grundversorgung und Schutz (alle Altersgruppen) ──────────────────────

    private static final List<SkbItem> GRUNDVERSORGUNG = List.of(
            new SkbItem("GV_ERN_QUALITAET",     "Qualität, Menge und Regelmäßigkeit der Nahrung",             SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_ERN_ALTERSGEM",     "Altersentsprechende Nahrungsmittelauswahl",                  SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_SCHLAFPLATZ",        "Schlafplatz und Schlafbedingungen",                          SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_KLEIDUNG",           "Kleidung (alters-/witterungsgerecht, Sauberkeit)",           SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_KP_HYGIENE",         "Körperhygiene",                                              SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_KP_ZAHNE",           "Zahnpflege",                                                 SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_BEAUFSICHTIGUNG",    "Beaufsichtigung / Schutz vor Unfallgefahren",                SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_SCHUTZ_KOERPERL",   "Schutz vor körperlicher Gewalt und Misshandlung",            SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_SCHUTZ_SEX",         "Schutz vor sexuellem Missbrauch",                           SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_SCHUTZ_HAEUSLICH",  "Schutz vor dem Miterleben häuslicher Gewalt",                SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_MED_VORSORGE",       "Vorsorgeuntersuchungen / Impfungen",                        SkbBereich.GRUNDVERSORGUNG_SCHUTZ),
            new SkbItem("GV_MED_BEHANDLUNG",     "Ärztliche Behandlung bei Krankheit / Medikamentengabe",     SkbBereich.GRUNDVERSORGUNG_SCHUTZ)
    );

    // ─── Interaktion Bezugsperson – Kind (0–14 Jahre, 8 Items) ────────────────

    private static final List<SkbItem> INTERAKTION_0_14 = List.of(
            new SkbItem("INT_AUFMERKSAMKEIT",        "Aufmerksamkeit, Körperkontakt, Blickkontakt, Zuwendung",    SkbBereich.INTERAKTION),
            new SkbItem("INT_WAHRNEHMUNG_BED",       "Angemessenheit der Wahrnehmung kindlicher Bedürfnisse",     SkbBereich.INTERAKTION),
            new SkbItem("INT_FEINFUEHLIGKEIT",        "Feinfühligkeit gegenüber emotionalen Bedürfnissen",        SkbBereich.INTERAKTION),
            new SkbItem("INT_GRENZSETZUNG",           "Grenzen setzen und Führen",                                SkbBereich.INTERAKTION),
            new SkbItem("INT_STIMULATION",            "Verbale Anregungen, Spiel- und Bewegungsmöglichkeiten",    SkbBereich.INTERAKTION),
            new SkbItem("INT_ANFORDERUNGEN",          "Angemessenheit von Anforderungen und Erwartungen",         SkbBereich.INTERAKTION),
            new SkbItem("INT_TAGESABLAUF",            "Strukturierter Tagesablauf / Zuverlässigkeit",             SkbBereich.INTERAKTION),
            new SkbItem("INT_AUSEINANDERSETZUNG",     "Auseinandersetzung der Erziehungsberechtigten untereinander", SkbBereich.INTERAKTION)
    );

    // ─── Interaktion Bezugsperson – Jugendliche*r (14–18 Jahre) ──────────────

    private static final List<SkbItem> INTERAKTION_14_18 = List.of(
            new SkbItem("INT_BEZIEHUNGSGESTALTUNG",   "Beziehungsgestaltung und emotionale Zuwendung",            SkbBereich.INTERAKTION),
            new SkbItem("INT_GRENZSETZUNG",           "Grenzen setzen und Führen",                                SkbBereich.INTERAKTION),
            new SkbItem("INT_ANFORDERUNGEN",          "Angemessenheit von Anforderungen und Erwartungen",         SkbBereich.INTERAKTION),
            new SkbItem("INT_TAGESABLAUF",            "Strukturierter Tagesablauf / Zuverlässigkeit",             SkbBereich.INTERAKTION),
            new SkbItem("INT_AUSEINANDERSETZUNG",     "Auseinandersetzung der Erziehungsberechtigten untereinander", SkbBereich.INTERAKTION)
    );

    // ─── Kooperationsbereitschaft der Sorgeberechtigten (alle Altersgruppen) ──

    private static final List<SkbItem> KOOPERATION = List.of(
            new SkbItem("KOOP_ANNAHME_HILFEN",       "Annahme von Hilfen / Aushandlungsbereitschaft",            SkbBereich.KOOPERATION),
            new SkbItem("KOOP_KONTAKTAUFNAHME",       "Verhalten bei Kontaktaufnahme",                           SkbBereich.KOOPERATION),
            new SkbItem("KOOP_PROBLEMEINSICHT",       "Problemeinsicht / Gefährdungswahrnehmung",                SkbBereich.KOOPERATION),
            new SkbItem("KOOP_JUGENDAMT",             "Verhalten gegenüber dem Jugendamt / Helfersystem",        SkbBereich.KOOPERATION),
            new SkbItem("KOOP_SCHUTZVEREINBARUNGEN",  "Einhalten von Schutzvereinbarungen",                      SkbBereich.KOOPERATION),
            new SkbItem("KOOP_VERANTWORTUNG",         "Übernahme von Verantwortung als Erziehungsberechtigte*r", SkbBereich.KOOPERATION)
    );

    // ─── Erscheinungsbild des Jugendlichen (nur 14–18 Jahre) ──────────────────

    private static final List<SkbItem> ERSCHEINUNGSBILD_14_18 = List.of(
            // Psychische Erscheinung
            new SkbItem("ERB_PSY_ZUSTAND",       "Emotionaler Zustand / Psychische Verfassung",                  SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_PSY_SELBST",        "Selbstwahrnehmung / Selbstkonzept",                            SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_PSY_STRESS",        "Stressregulation / Impulskontrolle",                           SkbBereich.ERSCHEINUNGSBILD),
            // Kognitive Erscheinung
            new SkbItem("ERB_KOG_SCHULE",        "Kognitive Entwicklung / Schule / Ausbildung",                  SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_KOG_MEDIEN",        "Umgang mit Medien",                                            SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_KOG_RISIKO",        "Risikoverhalten",                                              SkbBereich.ERSCHEINUNGSBILD),
            // Sozialverhalten
            new SkbItem("ERB_SOZ_GLEICHALTRIGE", "Soziale Kontakte / Beziehungen zu Gleichaltrigen",             SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_SOZ_ERWACHSENE",    "Beziehungsgestaltung zu Erwachsenen",                          SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_SOZ_FREIZEIT",      "Freizeitgestaltung",                                           SkbBereich.ERSCHEINUNGSBILD),
            new SkbItem("ERB_SOZ_DELINQUENZ",    "Delinquenz / Straffälligkeit",                                 SkbBereich.ERSCHEINUNGSBILD)
    );

    // ─── Gesamtkatalog ────────────────────────────────────────────────────────

    private static final Map<Altersgruppe, List<SkbItem>> KATALOG = Map.of(
            Altersgruppe.ALTER_0_3,   concat(GRUNDVERSORGUNG, INTERAKTION_0_14, KOOPERATION),
            Altersgruppe.ALTER_3_6,   concat(GRUNDVERSORGUNG, INTERAKTION_0_14, KOOPERATION),
            Altersgruppe.ALTER_6_14,  concat(GRUNDVERSORGUNG, INTERAKTION_0_14, KOOPERATION),
            Altersgruppe.ALTER_14_18, concat(GRUNDVERSORGUNG, INTERAKTION_14_18, KOOPERATION, ERSCHEINUNGSBILD_14_18)
    );

    public static List<SkbItem> itemsFuer(Altersgruppe altersgruppe) {
        return KATALOG.getOrDefault(altersgruppe, List.of());
    }

    public static boolean istGueltigerCode(Altersgruppe altersgruppe, String code) {
        return itemsFuer(altersgruppe).stream().anyMatch(i -> i.code().equals(code));
    }

    @SafeVarargs
    private static List<SkbItem> concat(List<SkbItem>... lists) {
        return java.util.Arrays.stream(lists)
                .flatMap(List::stream)
                .toList();
    }
}
