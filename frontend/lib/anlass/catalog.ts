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
 * ✅ Hier erweitern: Kategorien + Anlässe
 * Du kannst später auch defaultSeverity / weitere Metadaten ergänzen.
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
            { code: "BODY_MALNUTRITION", label: "Mangelernährung", defaultSeverity: 2 },
            { code: "BODY_MEDICAL_NEGLECT", label: "Medizinische Vernachlässigung", defaultSeverity: 2 },
            { code: "BODY_NEGLECT_APPEARANCE", label: "Vernachlässigtes Erscheinungsbild", defaultSeverity: 1 },
            { code: "BODY_PSYCHOSOMATIC", label: "Psychosomatische Beschwerden", defaultSeverity: 1 },
            { code: "BODY_SELF_HARM", label: "Selbstverletzendes Verhalten", defaultSeverity: 3 },
            { code: "BODY_ACUTE_HEALTH", label: "Akute gesundheitliche Gefährdung", defaultSeverity: 3 },
        ],
    },
    {
        key: "OTHER",
        title: "Sonstiges",
        items: [{ code: "OTHER", label: "Sonstiges", defaultSeverity: 0 }],
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