export type AnlassItem = {
    code: string;
    label: string;
    /** optional: später für Tag-Autofill/Severity Defaults, Kategorien, etc. */
    defaultSeverity?: number;
};

export type AnlassCategory = {
    key: string;
    title: string;
    items: AnlassItem[];
};

/**
 * §8a SGB VIII – praxisnahe Anlass-Codes
 * Hinweis:
 * - keine amtliche gesetzliche Codeliste
 * - strukturiert nach typischen "gewichtigen Anhaltspunkten" aus der Fachpraxis
 */
export const ANLASS_CATALOG: AnlassCategory[] = [
    {
        key: "BODY",
        title: "Körperbezogene Anlässe",
        items: [
            { code: "BODY_INJURY_VISIBLE", label: "Sichtbare Verletzungen", defaultSeverity: 2 },
            { code: "BODY_INJURY_REPEATED", label: "Wiederholte Verletzungen", defaultSeverity: 3 },
            { code: "BODY_INJURY_EXPLANATION_ODD", label: "Unplausible Erklärung für Verletzungen", defaultSeverity: 2 },
            { code: "BODY_PUNISHMENT_HINT", label: "Hinweis auf körperliche Bestrafung", defaultSeverity: 2 },
            { code: "BODY_BURNS_OR_SCALDS", label: "Verbrennungen oder Verbrühungen", defaultSeverity: 3 },
            { code: "BODY_BRUISES_PATTERNED", label: "Auffällige Hämatome / Verletzungsmuster", defaultSeverity: 3 },
            { code: "BODY_FRACTURE_SUSPICION", label: "Verdacht auf Frakturen / schwere körperliche Misshandlung", defaultSeverity: 3 },
            { code: "BODY_MALNUTRITION", label: "Mangelernährung", defaultSeverity: 2 },
            { code: "BODY_DEHYDRATION", label: "Hinweise auf Dehydrierung", defaultSeverity: 3 },
            { code: "BODY_MEDICAL_NEGLECT", label: "Medizinische Vernachlässigung", defaultSeverity: 2 },
            { code: "BODY_NEGLECT_APPEARANCE", label: "Vernachlässigtes Erscheinungsbild", defaultSeverity: 1 },
            { code: "BODY_POOR_HYGIENE", label: "Auffällige mangelnde Hygiene", defaultSeverity: 1 },
            { code: "BODY_INADEQUATE_CLOTHING", label: "Unangemessene / fehlende Kleidung", defaultSeverity: 1 },
            { code: "BODY_PSYCHOSOMATIC", label: "Psychosomatische Beschwerden", defaultSeverity: 1 },
            { code: "BODY_SELF_HARM", label: "Selbstverletzendes Verhalten", defaultSeverity: 3 },
            { code: "BODY_ACUTE_HEALTH", label: "Akute gesundheitliche Gefährdung", defaultSeverity: 3 },
        ],
    },
    {
        key: "PSYCH",
        title: "Psychische / emotionale Anlässe",
        items: [
            { code: "PSYCH_EXTREME_FEAR", label: "Ausgeprägte Angst / Furchtsamkeit", defaultSeverity: 2 },
            { code: "PSYCH_WITHDRAWAL", label: "Starker Rückzug / sozialer Rückzug", defaultSeverity: 1 },
            { code: "PSYCH_DEPRESSION_SIGNS", label: "Hinweise auf depressive Symptomatik", defaultSeverity: 2 },
            { code: "PSYCH_TRAUMA_SIGNS", label: "Trauma-Anzeichen / starke Übererregung", defaultSeverity: 2 },
            { code: "PSYCH_SLEEP_DISTURBANCE", label: "Massive Schlafstörungen / Albträume", defaultSeverity: 1 },
            { code: "PSYCH_REGRESSION", label: "Deutliche Regression im Verhalten", defaultSeverity: 1 },
            { code: "PSYCH_AGGRESSIVE_BEHAVIOR", label: "Auffällige Aggressivität", defaultSeverity: 1 },
            { code: "PSYCH_APATHY", label: "Apathie / emotionale Abflachung", defaultSeverity: 2 },
            { code: "PSYCH_LOW_SELF_WORTH", label: "Stark vermindertes Selbstwertgefühl", defaultSeverity: 1 },
            { code: "PSYCH_PARENTIFICATION", label: "Übermäßige Verantwortungsübernahme / Parentifizierung", defaultSeverity: 2 },
            { code: "PSYCH_SUICIDAL_HINT", label: "Suizidale Äußerungen / Hinweise", defaultSeverity: 3 },
            { code: "PSYCH_EMOTIONAL_ABUSE_HINT", label: "Hinweise auf seelische Misshandlung", defaultSeverity: 2 },
        ],
    },
    {
        key: "SEXUAL",
        title: "Sexualisierte Gewalt / Grenzverletzungen",
        items: [
            { code: "SEXUAL_DISCLOSURE", label: "Äußerung über sexuelle Übergriffe", defaultSeverity: 3 },
            { code: "SEXUAL_BEHAVIOR_INAPPROPRIATE", label: "Altersunangemessen sexualisiertes Verhalten", defaultSeverity: 3 },
            { code: "SEXUAL_BOUNDARY_VIOLATION", label: "Hinweise auf sexuelle Grenzverletzungen", defaultSeverity: 3 },
            { code: "SEXUAL_GENITAL_INJURY", label: "Verletzungen / Beschwerden im Intimbereich", defaultSeverity: 3 },
            { code: "SEXUAL_STI_PREGNANCY", label: "Sexuell übertragbare Infektion / Schwangerschaft mit Verdachtsmoment", defaultSeverity: 3 },
            { code: "SEXUAL_EXPOSURE_TO_PORN", label: "Konfrontation mit Pornografie / sexualisierten Inhalten", defaultSeverity: 2 },
            { code: "SEXUAL_GROOMING_HINT", label: "Hinweise auf Grooming", defaultSeverity: 3 },
            { code: "SEXUAL_ONLINE_EXPLOITATION", label: "Hinweise auf digitale sexuelle Ausbeutung", defaultSeverity: 3 },
            { code: "SEXUAL_PROSTITUTION_EXPLOITATION", label: "Hinweise auf sexuelle Ausbeutung", defaultSeverity: 3 },
        ],
    },
    {
        key: "NEGLECT",
        title: "Vernachlässigung",
        items: [
            { code: "NEGLECT_FOOD", label: "Unzureichende Ernährung", defaultSeverity: 2 },
            { code: "NEGLECT_HYGIENE", label: "Unzureichende Hygieneversorgung", defaultSeverity: 1 },
            { code: "NEGLECT_CLOTHING", label: "Unzureichende Bekleidung", defaultSeverity: 1 },
            { code: "NEGLECT_SLEEP_PLACE", label: "Ungeeigneter Schlafplatz / fehlender Schlafplatz", defaultSeverity: 2 },
            { code: "NEGLECT_MEDICAL_CARE", label: "Nicht sichergestellte medizinische Versorgung", defaultSeverity: 2 },
            { code: "NEGLECT_SUPERVISION_BASIC", label: "Grundlegende Versorgung nicht sichergestellt", defaultSeverity: 2 },
            { code: "NEGLECT_EDUCATION", label: "Schulische / institutionelle Vernachlässigung", defaultSeverity: 1 },
            { code: "NEGLECT_EMOTIONAL", label: "Emotionale Vernachlässigung", defaultSeverity: 2 },
            { code: "NEGLECT_CHRONIC", label: "Chronische Vernachlässigung", defaultSeverity: 3 },
            { code: "NEGLECT_INFANT_CARE", label: "Unzureichende Säuglings- / Kleinkindversorgung", defaultSeverity: 3 },
        ],
    },
    {
        key: "SUPERVISION",
        title: "Aufsicht / Schutz / Gefahrenexposition",
        items: [
            { code: "SUPERVISION_LEFT_ALONE", label: "Kind wiederholt unbeaufsichtigt", defaultSeverity: 2 },
            { code: "SUPERVISION_AGE_INAPPROPRIATE", label: "Aufsicht entspricht nicht dem Alter / Entwicklungsstand", defaultSeverity: 2 },
            { code: "SUPERVISION_DANGEROUS_ENVIRONMENT", label: "Gefährliche Umgebung frei zugänglich", defaultSeverity: 2 },
            { code: "SUPERVISION_TRAFFIC_RISK", label: "Erhöhte Verkehrs- / Wegesicherheitsgefährdung", defaultSeverity: 2 },
            { code: "SUPERVISION_SUBSTANCE_ACCESS", label: "Zugang zu Alkohol, Drogen, Medikamenten oder Waffen", defaultSeverity: 3 },
            { code: "SUPERVISION_RUNAWAY", label: "Weglaufen / Vermisstensituationen", defaultSeverity: 2 },
            { code: "SUPERVISION_NIGHT_UNATTENDED", label: "Nächtliches Alleinlassen", defaultSeverity: 3 },
        ],
    },
    {
        key: "DEVELOPMENT",
        title: "Entwicklung / Förderung / Teilhabe",
        items: [
            { code: "DEV_DELAY_NOTICEABLE", label: "Auffällige Entwicklungsverzögerung", defaultSeverity: 1 },
            { code: "DEV_LANGUAGE_DELAY", label: "Auffällige Sprachentwicklungsverzögerung", defaultSeverity: 1 },
            { code: "DEV_NO_SUPPORT", label: "Fehlende Entwicklungsförderung", defaultSeverity: 1 },
            { code: "DEV_SPECIAL_NEEDS_IGNORED", label: "Besonderer Förder- / Unterstützungsbedarf bleibt unbeachtet", defaultSeverity: 2 },
            { code: "DEV_SCHOOL_ABSENCE", label: "Auffällige Schulabwesenheit", defaultSeverity: 2 },
            { code: "DEV_DAYCARE_ABSENCE", label: "Auffällige Kita-Abwesenheit", defaultSeverity: 1 },
            { code: "DEV_SOCIAL_ISOLATION", label: "Soziale Isolation des Kindes", defaultSeverity: 1 },
            { code: "DEV_OVERBURDENED_CHILD", label: "Deutliche Überforderung des Kindes", defaultSeverity: 2 },
        ],
    },
    {
        key: "CHILD_STATEMENTS",
        title: "Äußerungen / Signale des Kindes oder Jugendlichen",
        items: [
            { code: "CHILD_DISCLOSES_VIOLENCE", label: "Kind berichtet von Gewalt", defaultSeverity: 3 },
            { code: "CHILD_DISCLOSES_NEGLECT", label: "Kind berichtet von Vernachlässigung", defaultSeverity: 3 },
            { code: "CHILD_DISCLOSES_SEXUAL", label: "Kind berichtet von sexualisierter Gewalt", defaultSeverity: 3 },
            { code: "CHILD_EXPRESSES_FEAR_OF_HOME", label: "Kind äußert Angst vor Zuhause / Bezugsperson", defaultSeverity: 3 },
            { code: "CHILD_DOES_NOT_WANT_HOME", label: "Kind will nicht nach Hause zurück", defaultSeverity: 2 },
            { code: "CHILD_REQUESTS_HELP", label: "Kind bittet ausdrücklich um Hilfe / Schutz", defaultSeverity: 3 },
            { code: "CHILD_INCONSISTENT_DISTRESS", label: "Starke Belastung ohne altersangemessene Erklärung", defaultSeverity: 2 },
        ],
    },
    {
        key: "PARENTING",
        title: "Elterliches Verhalten / Erziehungssituation",
        items: [
            { code: "PARENT_REJECTING", label: "Stark ablehnendes Verhalten gegenüber dem Kind", defaultSeverity: 2 },
            { code: "PARENT_HUMILIATING", label: "Demütigung / Herabsetzung des Kindes", defaultSeverity: 2 },
            { code: "PARENT_THREATENING", label: "Drohungen gegenüber dem Kind", defaultSeverity: 3 },
            { code: "PARENT_OVERWHELMED", label: "Deutliche Überforderung der Sorgeberechtigten", defaultSeverity: 1 },
            { code: "PARENT_UNCOOPERATIVE", label: "Massive Kooperationsverweigerung im Schutzkontext", defaultSeverity: 2 },
            { code: "PARENT_INCONSISTENT_CARE", label: "Sprunghaftes / unzuverlässiges Fürsorgeverhalten", defaultSeverity: 1 },
            { code: "PARENT_SUBSTANCE_IMPAIRED_CARE", label: "Eingeschränkte Erziehungsfähigkeit durch Suchtmittelkonsum", defaultSeverity: 2 },
            { code: "PARENT_PSYCH_IMPAIRED_CARE", label: "Eingeschränkte Erziehungsfähigkeit aufgrund psychischer Belastung", defaultSeverity: 2 },
            { code: "PARENT_DELUSIONAL_OR_CONFUSED", label: "Schwere psychische Desorganisation mit Auswirkung auf Versorgung", defaultSeverity: 3 },
            { code: "PARENT_FAILURE_TO_PROTECT", label: "Kind wird nicht vor bekannten Gefahren geschützt", defaultSeverity: 3 },
        ],
    },
    {
        key: "FAMILY",
        title: "Familiäre Belastung / Familiensystem",
        items: [
            { code: "FAMILY_DOMESTIC_VIOLENCE", label: "Häusliche Gewalt / Partnerschaftsgewalt", defaultSeverity: 3 },
            { code: "FAMILY_ESCALATING_CONFLICT", label: "Massiv eskalierende familiäre Konflikte", defaultSeverity: 2 },
            { code: "FAMILY_SEPARATION_CRISIS", label: "Trennungs- / Umgangskonflikt mit Kindesbelastung", defaultSeverity: 1 },
            { code: "FAMILY_SUBSTANCE_ABUSE", label: "Suchtbelastung im Familiensystem", defaultSeverity: 2 },
            { code: "FAMILY_MENTAL_ILLNESS", label: "Psychische Erkrankung im Familiensystem", defaultSeverity: 2 },
            { code: "FAMILY_CRIMINAL_CONTEXT", label: "Delinquenz- / Gewaltkontext im nahen Umfeld", defaultSeverity: 2 },
            { code: "FAMILY_CHRONIC_OVERLOAD", label: "Chronische familiäre Überlastung", defaultSeverity: 1 },
            { code: "FAMILY_NO_SUPPORT_NETWORK", label: "Fehlendes unterstützendes Netzwerk", defaultSeverity: 1 },
            { code: "FAMILY_PREVIOUS_PROTECTION_CASE", label: "Frühere Kinderschutzfälle / Vorbefassung", defaultSeverity: 2 },
        ],
    },
    {
        key: "LIVING",
        title: "Wohnsituation / materielles Umfeld",
        items: [
            { code: "LIVING_UNSAFE_HOME", label: "Unsichere / gesundheitsgefährdende Wohnsituation", defaultSeverity: 2 },
            { code: "LIVING_FILTH", label: "Massive Vermüllung / Verwahrlosung der Wohnung", defaultSeverity: 2 },
            { code: "LIVING_NO_HEATING_OR_POWER", label: "Fehlende Heizung / Strom / Wasser", defaultSeverity: 3 },
            { code: "LIVING_HOMELESSNESS", label: "Wohnungslosigkeit / drohende Obdachlosigkeit", defaultSeverity: 3 },
            { code: "LIVING_CROWDING", label: "Extreme räumliche Enge / Überbelegung", defaultSeverity: 1 },
            { code: "LIVING_NO_CHILD_SPACE", label: "Kein kindgerechter Rückzugs- oder Lebensraum", defaultSeverity: 1 },
            { code: "LIVING_HAZARDOUS_OBJECTS", label: "Gefährliche Gegenstände / Zustände in der Wohnung", defaultSeverity: 2 },
        ],
    },
    {
        key: "SOCIAL",
        title: "Soziales Umfeld / Drittgefährdung",
        items: [
            { code: "SOCIAL_VIOLENT_PERSON_IN_HOME", label: "Gewaltbereite Person im nahen Umfeld", defaultSeverity: 3 },
            { code: "SOCIAL_SEXUAL_RISK_PERSON", label: "Sexuell grenzverletzende / übergriffige Person im Umfeld", defaultSeverity: 3 },
            { code: "SOCIAL_PEER_VIOLENCE", label: "Schwere Gewalt im Peer-Kontext", defaultSeverity: 2 },
            { code: "SOCIAL_BULLYING_EXTREME", label: "Massives Mobbing mit Gefährdungscharakter", defaultSeverity: 2 },
            { code: "SOCIAL_CRIMINAL_EXPLOITATION", label: "Hinweise auf kriminelle Ausbeutung", defaultSeverity: 3 },
            { code: "SOCIAL_TRAFFICKING_HINT", label: "Hinweise auf Menschenhandel / Ausbeutung", defaultSeverity: 3 },
        ],
    },
    {
        key: "DIGITAL",
        title: "Digitale / mediale Gefährdungslagen",
        items: [
            { code: "DIGITAL_SEXTORTION_HINT", label: "Hinweise auf Sextortion", defaultSeverity: 3 },
            { code: "DIGITAL_CYBERGROOMING_HINT", label: "Hinweise auf Cybergrooming", defaultSeverity: 3 },
            { code: "DIGITAL_IMAGE_SHARING", label: "Verbreitung intimer Aufnahmen", defaultSeverity: 3 },
            { code: "DIGITAL_ONLINE_CONTROL", label: "Digitale Kontrolle / Überwachung des Kindes", defaultSeverity: 2 },
            { code: "DIGITAL_HARMFUL_CONTACTS", label: "Gefährdende Online-Kontakte", defaultSeverity: 2 },
        ],
    },
    {
        key: "ACUTE",
        title: "Akute Schutzanlässe",
        items: [
            { code: "ACUTE_IMMEDIATE_DANGER", label: "Unmittelbare akute Gefährdung", defaultSeverity: 3 },
            { code: "ACUTE_CHILD_ABANDONED", label: "Kind wurde zurückgelassen / nicht abgeholt", defaultSeverity: 3 },
            { code: "ACUTE_CAREGIVER_UNREACHABLE", label: "Sorgeberechtigte nicht erreichbar bei Schutzbedarf", defaultSeverity: 2 },
            { code: "ACUTE_INTOXICATED_CAREGIVER", label: "Akut intoxikierte Betreuungsperson", defaultSeverity: 3 },
            { code: "ACUTE_PSYCHIATRIC_CRISIS_CAREGIVER", label: "Akute psychische Krise der Betreuungsperson", defaultSeverity: 3 },
            { code: "ACUTE_VIOLENCE_ESCALATION", label: "Akute Eskalation von Gewalt", defaultSeverity: 3 },
            { code: "ACUTE_CHILD_UNDER_THREE_HIGH_RISK", label: "Besonders hohes Risiko bei sehr jungem Kind", defaultSeverity: 3 },
        ],
    },
    {
        key: "OTHER",
        title: "Sonstiges",
        items: [
            { code: "OTHER", label: "Sonstiges", defaultSeverity: 0 },
        ],
    },
];

export const ANLASS_CODES: string[] = ANLASS_CATALOG.flatMap((c) => c.items.map((i) => i.code));

export const ANLASS_LABELS: Record<string, string> = Object.fromEntries(
    ANLASS_CATALOG.flatMap((c) => c.items.map((i) => [i.code, i.label]))
);

export const ANLASS_DEFAULT_SEVERITY: Record<string, number> = Object.fromEntries(
    ANLASS_CATALOG.flatMap((c) => c.items.map((i) => [i.code, i.defaultSeverity ?? 0]))
);

export function anlassLabel(code: string | null | undefined): string {
    if (!code) return "—";
    return ANLASS_LABELS[code] ?? code;
}