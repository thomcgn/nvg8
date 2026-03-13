package org.thomcgn.backend.dji.catalog;

import org.thomcgn.backend.dji.model.DjiFormTyp;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.thomcgn.backend.dji.catalog.DjiBewertungstyp.*;
import static org.thomcgn.backend.dji.model.DjiFormTyp.*;

/**
 * Statischer Katalog aller DJI-Prüfbögen-Kriterien nach §8a SGB VIII.
 *
 * Quelle: Kindler, H. et al. (Hrsg.) – Handbuch Kindeswohlgefährdung nach §1666 BGB
 * und Allgemeiner Sozialer Dienst (ASD), Deutsches Jugendinstitut, 2006.
 *
 * Achtung: Bestehende position_codes dürfen nicht umbenannt werden (Datenkontinuität).
 */
public class DjiKatalog {

    // ─── Sicherheitseinschätzung (5 binäre Kriterien) ─────────────────────────
    // Prüfbogen Frage 71: Einschätzung der Sicherheit des Kindes.
    // Bereits ein erfülltes Kriterium kann sofortigen Handlungsbedarf begründen.

    private static final List<DjiItem> SICHERHEIT = List.of(
            new DjiItem("SICH_K1",
                    "Konkreter Verdacht auf aktuellen Missbrauch, Vernachlässigung oder sexuellen Missbrauch (eindeutige Hinweise)",
                    SICHERHEITSEINSCHAETZUNG, null, BOOLEAN_MIT_BELEGE),
            new DjiItem("SICH_K2",
                    "Schwerwiegende Beeinträchtigung der Erziehungsfähigkeit durch psychische Erkrankung, Sucht oder häusliche Gewalt (beim Hausbesuch sichtbar beeinträchtigt)",
                    SICHERHEITSEINSCHAETZUNG, null, BOOLEAN_MIT_BELEGE),
            new DjiItem("SICH_K3",
                    "Ein Haushaltsmitglied zeigt gewalttätiges oder stark unkontrolliertes Verhalten oder äußert glaubwürdige Drohungen gegen das Kind",
                    SICHERHEITSEINSCHAETZUNG, null, BOOLEAN_MIT_BELEGE),
            new DjiItem("SICH_K4",
                    "Zugang zum Kind wird verwehrt, Kind ist nicht auffindbar oder es gibt glaubwürdige Anzeichen für Verbringen in unkontrollierbare Umgebung",
                    SICHERHEITSEINSCHAETZUNG, null, BOOLEAN_MIT_BELEGE),
            new DjiItem("SICH_K5",
                    "Elterliche Verantwortungsablehnung und Hilfeverweigerung bei belegter Kindeswohlgefährdung in der unmittelbaren Vergangenheit",
                    SICHERHEITSEINSCHAETZUNG, null, BOOLEAN_MIT_BELEGE)
    );

    // ─── Risikoeinschätzung (6 Domänen) ───────────────────────────────────────
    // Prüfbogen Frage 70: Einschätzung des mittel- und längerfristigen
    // Misshandlungs- und Vernachlässigungsrisikos.

    private static final List<DjiItem> RISIKO = List.of(
            new DjiItem("RISI_LEBENSGESCH",
                    "Elterliche Entwicklungs- und Lebensgeschichte",
                    RISIKOEINSCHAETZUNG, "Elterliche Faktoren", FREITEXT),
            new DjiItem("RISI_PERSOENLICHKEIT",
                    "Elterliche Persönlichkeitsmerkmale und Dispositionen",
                    RISIKOEINSCHAETZUNG, "Elterliche Faktoren", FREITEXT),
            new DjiItem("RISI_PSYCH_GESUNDHEIT",
                    "Psychische Gesundheit und Intelligenz",
                    RISIKOEINSCHAETZUNG, "Elterliche Faktoren", FREITEXT),
            new DjiItem("RISI_LEBENSWELT",
                    "Merkmale der familiären Lebenswelt (häusliche Gewalt, soziale Isolation, Armut)",
                    RISIKOEINSCHAETZUNG, "Familiäre Faktoren", FREITEXT),
            new DjiItem("RISI_KIND",
                    "Merkmale des Kindes (Temperament, Behinderung, Erkrankung, Verhaltensstörung)",
                    RISIKOEINSCHAETZUNG, "Kindliche Faktoren", FREITEXT),
            new DjiItem("RISI_VORFAELLE",
                    "Merkmale gegenwärtiger und früherer Vorfälle (Vorvorfälle, Verantwortungsablehnung, Kooperationsverweigerung)",
                    RISIKOEINSCHAETZUNG, "Vorfälle", FREITEXT)
    );

    // ─── Erziehungsfähigkeit – Pflege und Versorgung ───────────────────────────
    // Prüfbogen Frage 63

    private static final List<DjiItem> ERZ_PFLEGE = List.of(
            new DjiItem("ERZ_PF_PFLEGEZUSTAND",
                    "Aktueller Pflegezustand und Entwicklungsgeschichte des Kindes (Kleidung, Zähne, Haut, Gewichtsentwicklung)",
                    ERZIEHUNGSFAEHIGKEIT_PFLEGE, "Befunde", FREITEXT),
            new DjiItem("ERZ_PF_PFLEGEVERHALTEN",
                    "Beobachtbares und berichtetes Pflegeverhalten im Lebensalltag (Fütterung, Tagesablauf, Reaktion auf Kindssignale)",
                    ERZIEHUNGSFAEHIGKEIT_PFLEGE, "Befunde", FREITEXT),
            new DjiItem("ERZ_PF_LEBENSUMFELD",
                    "Unmittelbares Lebensumfeld des Kindes (Unfallgefahren, Lebensmittelversorgung, Wohnsituation, Wohnstabilität)",
                    ERZIEHUNGSFAEHIGKEIT_PFLEGE, "Befunde", FREITEXT),
            new DjiItem("ERZ_PF_VERAENDERUNG",
                    "Veränderungen nach angemessener Intervention in diesem Bereich",
                    ERZIEHUNGSFAEHIGKEIT_PFLEGE, "Verlauf", FREITEXT)
    );

    // ─── Erziehungsfähigkeit – Bindung ─────────────────────────────────────────
    // Prüfbogen Frage 64

    private static final List<DjiItem> ERZ_BINDUNG = List.of(
            new DjiItem("ERZ_BI_BEZIEHUNGSGESCH",
                    "Beziehungsgeschichte des Kindes zur Bindungsperson (Trennungen, psychische Nichtverfügbarkeit, emotionale Zurückweisung)",
                    ERZIEHUNGSFAEHIGKEIT_BINDUNG, "Kind", FREITEXT),
            new DjiItem("ERZ_BI_KINDVERHALTEN",
                    "Kindliches Verhalten in bindungsrelevanten Situationen (keine Orientierung, Angstverhalten, undifferenzierte Freundlichkeit, Rollenumkehr)",
                    ERZIEHUNGSFAEHIGKEIT_BINDUNG, "Kind", FREITEXT),
            new DjiItem("ERZ_BI_INNERES_BILD",
                    "Inneres Bild des Kindes von der Beziehung (ab Kindergartenalter: generalisiertes Erleben von Zurückweisung)",
                    ERZIEHUNGSFAEHIGKEIT_BINDUNG, "Kind", FREITEXT),
            new DjiItem("ERZ_BI_PFLEGEVERHALTEN",
                    "Beobachtbares Pflegeverhalten der Bindungsperson (Feinfühligkeit: akkurate Wahrnehmung, zeitnahe angemessene Reaktion)",
                    ERZIEHUNGSFAEHIGKEIT_BINDUNG, "Bezugsperson", FREITEXT),
            new DjiItem("ERZ_BI_HALTUNG_ELTERN",
                    "Geäußerte Haltung der Bindungsperson zum Kind und zur Erziehungsrolle (Zurückweisung, Entwertung, Konfusion/Distanz)",
                    ERZIEHUNGSFAEHIGKEIT_BINDUNG, "Bezugsperson", FREITEXT),
            new DjiItem("ERZ_BI_LEBENSGESCH_ELTERN",
                    "Lebensgeschichte und aktuelle Situation der Bindungsperson (eigene positive Beziehungserfahrungen, Verfügbarkeitshindernisse)",
                    ERZIEHUNGSFAEHIGKEIT_BINDUNG, "Bezugsperson", FREITEXT)
    );

    // ─── Erziehungsfähigkeit – Regeln und Werte ────────────────────────────────
    // Prüfbogen Frage 65

    private static final List<DjiItem> ERZ_REGELN = List.of(
            new DjiItem("ERZ_RW_STABILITAET",
                    "Stabilität der Elternperson für Werte- und Regelvermittlung (Alltagsbewältigung, Instabilitätsindikatoren)",
                    ERZIEHUNGSFAEHIGKEIT_REGELN, null, FREITEXT),
            new DjiItem("ERZ_RW_ENGAGEMENT",
                    "Mindestmaß elterlichen Engagements und Interesses am Kind (Kenntnis des Kinderalltags, Reaktion auf Fremdberichte)",
                    ERZIEHUNGSFAEHIGKEIT_REGELN, null, FREITEXT),
            new DjiItem("ERZ_RW_KINDSBILD",
                    "Elterliches Bild vom Kind als realistisches Fundament (altersangemessene Erwartungen, Attributionsverzerrungen)",
                    ERZIEHUNGSFAEHIGKEIT_REGELN, null, FREITEXT),
            new DjiItem("ERZ_RW_ZIELE_MITTEL",
                    "Grundlegend angemessene Erziehungsziele und -mittel (keine schädigenden Strafen, klare Orientierung, keine kriminelle/missbräuchliche Erziehung)",
                    ERZIEHUNGSFAEHIGKEIT_REGELN, null, FREITEXT),
            new DjiItem("ERZ_RW_INTERVENTION",
                    "Erfolge angemessener Interventionen in diesem Bereich",
                    ERZIEHUNGSFAEHIGKEIT_REGELN, null, FREITEXT)
    );

    // ─── Erziehungsfähigkeit – Förderung ───────────────────────────────────────
    // Prüfbogen Frage 66

    private static final List<DjiItem> ERZ_FOERDERUNG = List.of(
            new DjiItem("ERZ_FO_ENTWICKLUNGSSTAND",
                    "Entwicklungsstand des Kindes in frühen Jahren (Verzögerungen als Hinweis auf unzureichende Stimulation)",
                    ERZIEHUNGSFAEHIGKEIT_FOERDERUNG, null, FREITEXT),
            new DjiItem("ERZ_FO_STIMULATIONSGEHALT",
                    "Stimulationsgehalt der familiären Umgebung (Spielmaterialien, Interaktionsqualität, Hausaufgabenunterstützung)",
                    ERZIEHUNGSFAEHIGKEIT_FOERDERUNG, null, FREITEXT),
            new DjiItem("ERZ_FO_HALTUNG_ELTERN",
                    "Haltung der Eltern zur Förderaufgabe und zur Schulpflicht",
                    ERZIEHUNGSFAEHIGKEIT_FOERDERUNG, null, FREITEXT),
            new DjiItem("ERZ_FO_REAKTION",
                    "Reaktion auf Unterstützungsmaßnahmen zur Förderfähigkeit",
                    ERZIEHUNGSFAEHIGKEIT_FOERDERUNG, null, FREITEXT)
    );

    // ─── Einordnungsschema kindliche Bedürfnisse (6-stufig) ───────────────────
    // Skala: 0=Sehr gut | 1=Gut | 2=Ausreichend | 3=Grenzwertig |
    //        4=Unzureichend | 5=Deutlich unzureichend

    private static final List<DjiItem> BEDUERFNISSE = List.of(
            // Physiologische Bedürfnisse
            new DjiItem("BED_PHY_SCHLAF",         "Schlaf, Ruhe und Wach-/Ruherhythmus",                          BEDUERFNIS_SCHEMA, "Physiologische Bedürfnisse", SECHSSTUFEN),
            new DjiItem("BED_PHY_ERNAEHRUNG",     "Ernährung und Trinken (Qualität, Menge, Regelmäßigkeit)",      BEDUERFNIS_SCHEMA, "Physiologische Bedürfnisse", SECHSSTUFEN),
            new DjiItem("BED_PHY_KOERPERPFLEGE",  "Körperpflege und Sauberkeit",                                  BEDUERFNIS_SCHEMA, "Physiologische Bedürfnisse", SECHSSTUFEN),
            new DjiItem("BED_PHY_GESUNDHEIT",     "Gesundheitsfürsorge und medizinische Versorgung",              BEDUERFNIS_SCHEMA, "Physiologische Bedürfnisse", SECHSSTUFEN),
            new DjiItem("BED_PHY_KOERPERKONTAKT", "Körperkontakt und körperliche Zuwendung",                      BEDUERFNIS_SCHEMA, "Physiologische Bedürfnisse", SECHSSTUFEN),
            // Schutz und Sicherheit
            new DjiItem("BED_SCH_AUFSICHT",       "Aufsicht und Schutz vor Unfallgefahren",                       BEDUERFNIS_SCHEMA, "Schutz und Sicherheit", SECHSSTUFEN),
            new DjiItem("BED_SCH_KLEIDUNG",       "Wetterangemessene Kleidung",                                   BEDUERFNIS_SCHEMA, "Schutz und Sicherheit", SECHSSTUFEN),
            new DjiItem("BED_SCH_KRANKHEIT",      "Schutz vor Krankheiten und physischen Bedrohungen",            BEDUERFNIS_SCHEMA, "Schutz und Sicherheit", SECHSSTUFEN),
            new DjiItem("BED_SCH_BEDROHUNGEN",    "Schutz vor anderen Bedrohungen (häusliche Gewalt, Missbrauch)", BEDUERFNIS_SCHEMA, "Schutz und Sicherheit", SECHSSTUFEN),
            // Soziale Bindungen
            new DjiItem("BED_SOZ_BEZUGSPERSONEN", "Konstante Bezugspersonen",                                     BEDUERFNIS_SCHEMA, "Soziale Bindungen", SECHSSTUFEN),
            new DjiItem("BED_SOZ_EINFUEHLUNG",    "Einfühlendes Verständnis und Zuwendung",                       BEDUERFNIS_SCHEMA, "Soziale Bindungen", SECHSSTUFEN),
            new DjiItem("BED_SOZ_VERLAESSLICHKEIT","Emotionale Verlässlichkeit",                                   BEDUERFNIS_SCHEMA, "Soziale Bindungen", SECHSSTUFEN),
            new DjiItem("BED_SOZ_ZUGEHOERIGKEIT", "Zugehörigkeit zu sozialen Gruppen",                            BEDUERFNIS_SCHEMA, "Soziale Bindungen", SECHSSTUFEN),
            // Wertschätzung
            new DjiItem("BED_WERT_PHYSISCH",      "Respekt vor physischer Unversehrtheit",                        BEDUERFNIS_SCHEMA, "Wertschätzung", SECHSSTUFEN),
            new DjiItem("BED_WERT_PSYCHISCH",     "Respekt vor psychischer Unversehrtheit",                       BEDUERFNIS_SCHEMA, "Wertschätzung", SECHSSTUFEN),
            new DjiItem("BED_WERT_SEXUELL",       "Respekt vor sexueller Unversehrtheit",                         BEDUERFNIS_SCHEMA, "Wertschätzung", SECHSSTUFEN),
            new DjiItem("BED_WERT_PERSON",        "Respekt vor der Person und Individualität",                    BEDUERFNIS_SCHEMA, "Wertschätzung", SECHSSTUFEN),
            new DjiItem("BED_WERT_EIGENSTAENDIG", "Anerkennung altersabhängiger Eigenständigkeit",                BEDUERFNIS_SCHEMA, "Wertschätzung", SECHSSTUFEN),
            // Soziale, kognitive, emotionale und ethische Erfahrungen
            new DjiItem("BED_ENT_ANREGUNGEN",     "Altersentsprechende Anregungen, Spiel und Bewegung",           BEDUERFNIS_SCHEMA, "Soziale und kognitive Erfahrungen", SECHSSTUFEN),
            new DjiItem("BED_ENT_LEISTUNGEN",     "Leistungsanforderungen und Werte- und Normenübermittlung",     BEDUERFNIS_SCHEMA, "Soziale und kognitive Erfahrungen", SECHSSTUFEN),
            new DjiItem("BED_ENT_SOZIALE_BEZ",    "Soziale Beziehungen und Umwelterfahrungen",                    BEDUERFNIS_SCHEMA, "Soziale und kognitive Erfahrungen", SECHSSTUFEN),
            new DjiItem("BED_ENT_SPRACHANREGUNG", "Sprachanregung und Förderung von Lernmotivation",              BEDUERFNIS_SCHEMA, "Soziale und kognitive Erfahrungen", SECHSSTUFEN),
            new DjiItem("BED_ENT_GRENZSETZUNG",   "Grenzsetzung und Orientierung",                                BEDUERFNIS_SCHEMA, "Soziale und kognitive Erfahrungen", SECHSSTUFEN)
    );

    // ─── Förderungsbedarf des Kindes (7 Dimensionen) ──────────────────────────
    // Prüfbogen Frage 60

    private static final List<DjiItem> FOERDERUNG = List.of(
            new DjiItem("FOE_BEZUGSPERSON",
                    "Schwierigkeiten in der Beziehung zu Hauptbezugspersonen",
                    FOERDERUNGSBEDARF, null, FREITEXT),
            new DjiItem("FOE_KOERPERL",
                    "Körperliche Einschränkungen oder gesundheitliche Beeinträchtigungen",
                    FOERDERUNGSBEDARF, null, FREITEXT),
            new DjiItem("FOE_PSYCH",
                    "Belastungen oder Einschränkungen der psychischen Gesundheit (Stimmung, Angst, Selbstverletzung)",
                    FOERDERUNGSBEDARF, null, FREITEXT),
            new DjiItem("FOE_GLEICHALTRIGE",
                    "Schwierigkeiten in Beziehungen zu Gleichaltrigen",
                    FOERDERUNGSBEDARF, null, FREITEXT),
            new DjiItem("FOE_REGELN",
                    "Schwierigkeiten im Umgang mit Regeln und Autoritäten außerhalb der Familie",
                    FOERDERUNGSBEDARF, null, FREITEXT),
            new DjiItem("FOE_LERNEN",
                    "Belastungen des Lern- und Leistungsvermögens (kognitive Verzögerungen, Schulversagen)",
                    FOERDERUNGSBEDARF, null, FREITEXT),
            new DjiItem("FOE_PERSOENLICHKEIT",
                    "Schwierigkeiten bei der Entwicklung zu einer eigenständigen Persönlichkeit",
                    FOERDERUNGSBEDARF, null, FREITEXT)
    );

    // ─── Ressourcen des Kindes (4 Domänen) ────────────────────────────────────
    // Prüfbogen Frage 61

    private static final List<DjiItem> RESSOURCEN = List.of(
            new DjiItem("RES_SOZ_BEZ",
                    "Positive soziale Beziehungen zu Erwachsenen und Gleichaltrigen",
                    RESSOURCEN_KIND, null, FREITEXT),
            new DjiItem("RES_STAERKEN",
                    "Stärken in der Schule oder besondere sportliche, handwerkliche oder technische Fähigkeiten",
                    RESSOURCEN_KIND, null, FREITEXT),
            new DjiItem("RES_FREIZEIT",
                    "Positive Freizeitinteressen und Hobbys",
                    RESSOURCEN_KIND, null, FREITEXT),
            new DjiItem("RES_PSYCH",
                    "Psychische und emotionale Stärken (soziale Kompetenz, Konfliktlösung, positives Selbstbild)",
                    RESSOURCEN_KIND, null, FREITEXT)
    );

    // ─── Veränderungsbereitschaft der Eltern (6 Domänen) ──────────────────────
    // Prüfbogen Frage 72

    private static final List<DjiItem> VERAENDERUNG = List.of(
            new DjiItem("VERA_ZUFRIEDENHEIT",
                    "Wahrnehmung der Situation durch die Eltern (Fähigkeit, Gefährdungen und Belastungen zu erkennen)",
                    VERAENDERUNGSBEREITSCHAFT, null, FREITEXT),
            new DjiItem("VERA_SELBSTVERTRAUEN",
                    "Selbstvertrauen und realistische Hoffnung auf Veränderung (gelernte Hilflosigkeit, Depression als Hindernisse)",
                    VERAENDERUNGSBEREITSCHAFT, null, FREITEXT),
            new DjiItem("VERA_NORMEN",
                    "Subjektive Normen zur Hilfesuche (Privatheit, religiöse Vorbehalte, Überzeugung von der Nutzlosigkeit von Hilfe)",
                    VERAENDERUNGSBEREITSCHAFT, null, FREITEXT),
            new DjiItem("VERA_HALTUNG",
                    "Haltung gegenüber belegbaren Kindeswohlgefährdungen (Verantwortungsübernahme vs. -ablehnung)",
                    VERAENDERUNGSBEREITSCHAFT, null, FREITEXT),
            new DjiItem("VERA_HILFEGESCH",
                    "Geschichte der Inanspruchnahme und Wirkung früherer Hilfen",
                    VERAENDERUNGSBEREITSCHAFT, null, FREITEXT),
            new DjiItem("VERA_EINSCHRAENKUNGEN",
                    "Einschränkungen der Fähigkeit, von verfügbaren Hilfen zu profitieren (Persönlichkeitsstörung, Sucht, Intelligenzminderung)",
                    VERAENDERUNGSBEREITSCHAFT, null, FREITEXT)
    );

    // ─── Gesamtkatalog ────────────────────────────────────────────────────────

    private static final Map<DjiFormTyp, List<DjiItem>> KATALOG = Map.ofEntries(
            Map.entry(SICHERHEITSEINSCHAETZUNG,      SICHERHEIT),
            Map.entry(RISIKOEINSCHAETZUNG,           RISIKO),
            Map.entry(ERZIEHUNGSFAEHIGKEIT_PFLEGE,   ERZ_PFLEGE),
            Map.entry(ERZIEHUNGSFAEHIGKEIT_BINDUNG,  ERZ_BINDUNG),
            Map.entry(ERZIEHUNGSFAEHIGKEIT_REGELN,   ERZ_REGELN),
            Map.entry(ERZIEHUNGSFAEHIGKEIT_FOERDERUNG, ERZ_FOERDERUNG),
            Map.entry(BEDUERFNIS_SCHEMA,             BEDUERFNISSE),
            Map.entry(FOERDERUNGSBEDARF,             FOERDERUNG),
            Map.entry(RESSOURCEN_KIND,               RESSOURCEN),
            Map.entry(VERAENDERUNGSBEREITSCHAFT,     VERAENDERUNG)
    );

    public static List<DjiItem> itemsFuer(DjiFormTyp formTyp) {
        return KATALOG.getOrDefault(formTyp, List.of());
    }

    public static boolean istGueltigerCode(DjiFormTyp formTyp, String code) {
        return itemsFuer(formTyp).stream().anyMatch(i -> i.code().equals(code));
    }

    public static Map<String, DjiItem> alsMap(DjiFormTyp formTyp) {
        return itemsFuer(formTyp).stream()
                .collect(Collectors.toMap(DjiItem::code, i -> i));
    }

    /** Alle Formtypen als geordnete Liste für die UI-Auswahl. */
    public static List<DjiFormTyp> alleFormTypen() {
        return Arrays.asList(DjiFormTyp.values());
    }
}
