"use client";

import * as React from "react";
import type { MeldungDraftRequest, MeldungResponse } from "@/lib/api/meldung";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function clampSeverity(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(3, Math.round(n)));
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
    return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/* ---------------- Backend Enums (Frontend mirrors) ----------------
   ✅ These MUST match Java enums exactly
------------------------------------------------------------------- */

// Meldeweg / Dringlichkeit / Datenbasis / AmpelStatus / JugendamtInformiert / JugendamtKontaktart
const MELDEWEG = ["TELEFON", "EMAIL", "PERSOENLICH", "BRIEF", "SONSTIGES"] as const;
const MELDEWEG_LABEL: Record<(typeof MELDEWEG)[number], string> = {
    TELEFON: "Telefon",
    EMAIL: "E-Mail",
    PERSOENLICH: "Persönlich",
    BRIEF: "Brief",
    SONSTIGES: "Sonstiges",
};

const DRING = ["AKUT_HEUTE", "ZEITNAH_24_48H", "BEOBACHTEN", "UNKLAR"] as const;
const DRING_LABEL: Record<(typeof DRING)[number], string> = {
    AKUT_HEUTE: "Akut (heute)",
    ZEITNAH_24_48H: "Zeitnah (24–48h)",
    BEOBACHTEN: "Beobachten",
    UNKLAR: "Unklar",
};

const DATENB = ["BEOBACHTUNG", "ERZAEHLUNG", "DOKUMENT", "UNKLAR"] as const;
const DATENB_LABEL: Record<(typeof DATENB)[number], string> = {
    BEOBACHTUNG: "Beobachtung",
    ERZAEHLUNG: "Erzählung",
    DOKUMENT: "Dokument",
    UNKLAR: "Unklar",
};

const AMPEL = ["GRUEN", "GELB", "ROT"] as const;
const AMPEL_LABEL: Record<(typeof AMPEL)[number], string> = {
    GRUEN: "Grün",
    GELB: "Gelb",
    ROT: "Rot",
};

const JUG_INF = ["JA", "NEIN", "UNKLAR"] as const;
const JUG_INF_LABEL: Record<(typeof JUG_INF)[number], string> = {
    JA: "Ja",
    NEIN: "Nein",
    UNKLAR: "Unklar",
};

const JUG_KONTAKTART = ["TELEFON", "EMAIL", "SCHRIFTLICH", "PERSOENLICH"] as const;
const JUG_KONTAKTART_LABEL: Record<(typeof JUG_KONTAKTART)[number], string> = {
    TELEFON: "Telefon",
    EMAIL: "E-Mail",
    SCHRIFTLICH: "Schriftlich",
    PERSOENLICH: "Persönlich",
};

// Observation enums
const OBS_QUELLE = ["EIGENE_WAHRNEHMUNG", "KIND", "DRITTE", "UNBEKANNT"] as const;
const OBS_QUELLE_LABEL: Record<(typeof OBS_QUELLE)[number], string> = {
    EIGENE_WAHRNEHMUNG: "Eigene Wahrnehmung",
    KIND: "Kind",
    DRITTE: "Dritte",
    UNBEKANNT: "Unbekannt",
};

const OBS_ORT = ["ZUHAUSE", "SCHULE_KITA", "OEFFENTLICH", "SONSTIGES"] as const;
const OBS_ORT_LABEL: Record<(typeof OBS_ORT)[number], string> = {
    ZUHAUSE: "Zuhause",
    SCHULE_KITA: "Schule/Kita",
    OEFFENTLICH: "Öffentlich",
    SONSTIGES: "Sonstiges",
};

const OBS_ZEITRAUM = ["EINMALIG", "WIEDERHOLT", "UNBEKANNT"] as const;
const OBS_ZEITRAUM_LABEL: Record<(typeof OBS_ZEITRAUM)[number], string> = {
    EINMALIG: "Einmalig",
    WIEDERHOLT: "Wiederholt",
    UNBEKANNT: "Unbekannt",
};

const SICHT = ["INTERN", "EXTERN"] as const;
const SICHT_LABEL: Record<(typeof SICHT)[number], string> = {
    INTERN: "Intern",
    EXTERN: "Extern",
};

// ✅ AbweichungZurAutoAmpel (Java): NIEDRIGER | HOEHER | GLEICH
const ABW_AUTO = ["GLEICH", "NIEDRIGER", "HOEHER"] as const;
const ABW_AUTO_LABEL: Record<(typeof ABW_AUTO)[number], string> = {
    GLEICH: "Keine Abweichung (entspricht Vorbewertung)",
    NIEDRIGER: "Abweichung: niedriger als Vorbewertung",
    HOEHER: "Abweichung: höher als Vorbewertung",
};

// ✅ JaNeinUnklar (used by akutKindSicherUntergebracht)
const JANEINUNKLAR = ["JA", "NEIN", "UNKLAR"] as const;
const JNU_LABEL: Record<(typeof JANEINUNKLAR)[number], string> = {
    JA: "Ja",
    NEIN: "Nein",
    UNKLAR: "Unklar",
};

// ✅ Contacts
const KONTAKT_MIT = ["KIND", "MUTTER", "VATER", "BEZUGSPERSON", "SONSTIGE"] as const;
const KONTAKT_MIT_LABEL: Record<(typeof KONTAKT_MIT)[number], string> = {
    KIND: "Kind",
    MUTTER: "Mutter",
    VATER: "Vater",
    BEZUGSPERSON: "Bezugsperson",
    SONSTIGE: "Sonstige Person",
};

const KONTAKT_STATUS = ["GEPLANT", "ERREICHT", "NICHT_ERREICHT", "ABGEBROCHEN"] as const;
const KONTAKT_STATUS_LABEL: Record<(typeof KONTAKT_STATUS)[number], string> = {
    GEPLANT: "Geplant",
    ERREICHT: "Erreicht",
    NICHT_ERREICHT: "Nicht erreicht",
    ABGEBROCHEN: "Abgebrochen",
};

// ✅ Extern
const EXTERN_STELLE = ["POLIZEI", "SCHULE_KITA", "ARZT_KLINIK", "SONSTIGE"] as const;
const EXTERN_STELLE_LABEL: Record<(typeof EXTERN_STELLE)[number], string> = {
    POLIZEI: "Polizei",
    SCHULE_KITA: "Schule/Kita",
    ARZT_KLINIK: "Ärztliche Stelle/Klinik",
    SONSTIGE: "Sonstige Stelle",
};

// ✅ Attachments
const ATTACH_TYP = ["DOKUMENT", "FOTO", "AUDIO", "VIDEO", "SONSTIGES"] as const;
const ATTACH_TYP_LABEL: Record<(typeof ATTACH_TYP)[number], string> = {
    DOKUMENT: "Dokument",
    FOTO: "Foto",
    AUDIO: "Audio",
    VIDEO: "Video",
    SONSTIGES: "Sonstiges",
};

/* ---------------- Anlass / Indikatoren (Demo) ---------------- */

type AnlassCategory = {
    key: string;
    title: string;
    items: Array<{ code: string; label: string }>;
};

export const ANLASS_CATALOG: AnlassCategory[] = [
    {
        key: "BODY",
        title: "Körperbezogene Anlässe",
        items: [
            { code: "BODY_INJURY_VISIBLE", label: "Sichtbare Verletzungen" },
            { code: "BODY_INJURY_REPEATED", label: "Wiederholte Verletzungen" },
            { code: "BODY_INJURY_EXPLANATION_ODD", label: "Unplausible Erklärung für Verletzungen" },
            { code: "BODY_PUNISHMENT_HINT", label: "Hinweis auf körperliche Bestrafung" },
            { code: "BODY_MALNUTRITION", label: "Mangelernährung" },
            { code: "BODY_MEDICAL_NEGLECT", label: "Medizinische Vernachlässigung" },
            { code: "BODY_NEGLECT_APPEARANCE", label: "Vernachlässigtes Erscheinungsbild" },
            { code: "BODY_PSYCHOSOMATIC", label: "Psychosomatische Beschwerden" },
            { code: "BODY_SELF_HARM", label: "Selbstverletzendes Verhalten" },
            { code: "BODY_ACUTE_HEALTH", label: "Akute gesundheitliche Gefährdung" },
        ],
    },
    { key: "OTHER", title: "Sonstiges", items: [{ code: "OTHER", label: "Sonstiges" }] },
];

const ANLASS_CODES: string[] = ANLASS_CATALOG.flatMap((c) => c.items.map((i) => i.code));
const ANLASS_LABELS: Record<string, string> = Object.fromEntries(
    ANLASS_CATALOG.flatMap((c) => c.items.map((i) => [i.code, i.label]))
);

const INDICATORS: { id: string; label: string }[] = [
    { id: "INJURY_UNEXPLAINED", label: "Unerklärte Verletzungen" },
    { id: "FEAR_OF_CAREGIVER", label: "Angst vor Bezugsperson" },
    { id: "NEGLECT_HYGIENE", label: "Vernachlässigung/Hygiene" },
    { id: "ABSENCE_PATTERN", label: "Auffälliges Fehlzeitenmuster" },
    { id: "DISCLOSURE", label: "Offenbarung/Aussage Kind" },
];

/* ---------------- Risk scoring (Auto-Ampel) ----------------
   Ziel: nachvollziehbare Vorbewertung aus Observations/Tags (+ Akutflags).
   - severity 0..3, max over all tags is strongest signal
   - repeated observations increase weight slightly
   - akute Flags add bonus
------------------------------------------------------------- */

function ampToRank(a: string | null | undefined): number {
    if (a === "GRUEN") return 0;
    if (a === "GELB") return 1;
    if (a === "ROT") return 2;
    return -1;
}

function rankToAmpel(rank: number): (typeof AMPEL)[number] {
    if (rank <= 0) return "GRUEN";
    if (rank === 1) return "GELB";
    return "ROT";
}

function computeAutoAssessment(form: MeldungDraftRequest) {
    const obs = (form as any).observations || [];
    let maxSeverity = 0;
    let sumSeverity = 0;
    let tagCount = 0;

    for (const o of obs) {
        for (const t of o?.tags || []) {
            const sev = clampSeverity(Number(t?.severity ?? 0));
            maxSeverity = Math.max(maxSeverity, sev);
            sumSeverity += sev;
            tagCount += 1;
        }
    }

    const avgSeverity = tagCount ? sumSeverity / tagCount : 0;

    const repeatedCount = obs.filter((o: any) => o?.zeitraum === "WIEDERHOLT").length;
    const akutBonus =
        (form.akutGefahrImVerzug ? 1.25 : 0) + (form.akutNotrufErforderlich ? 0.75 : 0);

    // Score design (simple + explainable):
    // - baseline from maxSeverity (dominant)
    // - avgSeverity contributes mildly
    // - repeated observations add small increment
    // - akut flags add bonus
    const score =
        maxSeverity * 2.0 + avgSeverity * 1.0 + Math.min(2, repeatedCount) * 0.5 + akutBonus;

    // Thresholds tuned for 0..3 severity:
    // score < 2.0 => GRUEN
    // score < 4.5 => GELB
    // else ROT
    let autoAmpel: (typeof AMPEL)[number] = "GRUEN";
    if (score >= 4.5) autoAmpel = "ROT";
    else if (score >= 2.0) autoAmpel = "GELB";

    // Human-readable rationale (short)
    const rationaleParts: string[] = [];
    if (tagCount === 0) rationaleParts.push("Keine Tags/Severity angegeben");
    else {
        rationaleParts.push(`Max-Severity ${maxSeverity}`);
        rationaleParts.push(`Ø-Severity ${avgSeverity.toFixed(1)}`);
        if (repeatedCount) rationaleParts.push(`${repeatedCount}× wiederholt`);
    }
    if (form.akutGefahrImVerzug) rationaleParts.push("Gefahr im Verzug");
    if (form.akutNotrufErforderlich) rationaleParts.push("Notruf");

    return {
        score: Number.isFinite(score) ? Math.round(score * 10) / 10 : 0,
        autoAmpel,
        rationale: rationaleParts.join(" · "),
        maxSeverity,
        tagCount,
    };
}

function computeAbweichungZurAuto(fachAmpel: string | null | undefined, autoAmpel: string) {
    const f = ampToRank(fachAmpel);
    const a = ampToRank(autoAmpel);
    if (f < 0 || a < 0) return "GLEICH" as const;
    if (f === a) return "GLEICH" as const;
    return f > a ? ("HOEHER" as const) : ("NIEDRIGER" as const);
}

/* ---------------- DTO mapping ---------------- */

function toDraftFromResponse(v: MeldungResponse): MeldungDraftRequest {
    return {
        erfasstVonRolle: (v as any).erfasstVonRolle ?? "",

        meldeweg: (v as any).meldeweg ?? "TELEFON",
        meldewegSonstiges: (v as any).meldewegSonstiges ?? null,
        meldendeStelleKontakt: (v as any).meldendeStelleKontakt ?? null,

        dringlichkeit: (v as any).dringlichkeit ?? "UNKLAR",
        datenbasis: (v as any).datenbasis ?? "UNKLAR",

        einwilligungVorhanden: (v as any).einwilligungVorhanden ?? null,
        schweigepflichtentbindungVorhanden: (v as any).schweigepflichtentbindungVorhanden ?? null,

        kurzbeschreibung: (v as any).kurzbeschreibung ?? "",

        fachAmpel: (v as any).fachAmpel ?? null,
        fachText: (v as any).fachText ?? null,

        abweichungZurAuto: (v as any).abweichungZurAuto ?? "GLEICH",
        abweichungsBegruendung: (v as any).abweichungsBegruendung ?? null,

        akutGefahrImVerzug: (v as any).akutGefahrImVerzug ?? false,
        akutBegruendung: (v as any).akutBegruendung ?? null,
        akutNotrufErforderlich: (v as any).akutNotrufErforderlich ?? null,
        akutKindSicherUntergebracht: (v as any).akutKindSicherUntergebracht ?? "UNKLAR",

        verantwortlicheFachkraftUserId: (v as any).verantwortlicheFachkraftUserId ?? null,
        naechsteUeberpruefungAm: (v as any).naechsteUeberpruefungAm ?? null,
        zusammenfassung: (v as any).zusammenfassung ?? null,

        anlassCodes: (v as any).anlassCodes ?? [],

        observations: ((v as any).observations || []).map((o: any) => ({
            zeitpunkt: o.zeitpunkt ?? null,
            zeitraum: o.zeitraum ?? null,
            ort: o.ort ?? null,
            ortSonstiges: o.ortSonstiges ?? null,
            quelle: o.quelle ?? "UNBEKANNT",
            text: o.text ?? "",
            woertlichesZitat: o.woertlichesZitat ?? null,
            koerperbefund: o.koerperbefund ?? null,
            verhaltenKind: o.verhaltenKind ?? null,
            verhaltenBezug: o.verhaltenBezug ?? null,
            sichtbarkeit: o.sichtbarkeit ?? "INTERN",
            tags: (o.tags || []).map((t: any) => ({
                anlassCode: t.anlassCode ?? null,
                indicatorId: t.indicatorId ?? null,
                severity: t.severity ?? null,
                comment: t.comment ?? null,
            })),
        })),

        jugendamt: (v as any).jugendamt
            ? {
                informiert: (v as any).jugendamt.informiert ?? null,
                kontaktAm: (v as any).jugendamt.kontaktAm ?? null,
                kontaktart: (v as any).jugendamt.kontaktart ?? null,
                aktenzeichen: (v as any).jugendamt.aktenzeichen ?? null,
                begruendung: (v as any).jugendamt.begruendung ?? null,
            }
            : null,

        contacts: ((v as any).contacts || []).map((c: any) => ({
            kontaktMit: c.kontaktMit ?? "SONSTIGE",
            kontaktAm: c.kontaktAm ?? null,
            status: c.status ?? "GEPLANT",
            notiz: c.notiz ?? null,
            ergebnis: c.ergebnis ?? null,
        })),

        extern: ((v as any).extern || []).map((x: any) => ({
            stelle: x.stelle ?? "SONSTIGE",
            stelleSonstiges: x.stelleSonstiges ?? null,
            am: x.am ?? null,
            begruendung: x.begruendung ?? null,
            ergebnis: x.ergebnis ?? null,
        })),

        attachments: ((v as any).attachments || []).map((a: any) => ({
            fileId: a.fileId ?? null,
            typ: a.typ ?? "DOKUMENT",
            titel: a.titel ?? null,
            beschreibung: a.beschreibung ?? null,
            sichtbarkeit: a.sichtbarkeit ?? "INTERN",
            rechtsgrundlageHinweis: a.rechtsgrundlageHinweis ?? null,
        })),

        sectionReasons: (v as any).sectionReasons ?? {},
    } as any;
}

/* ---------------- Component ---------------- */

export function MeldungEditor(props: {
    value: MeldungResponse;
    disabled?: boolean;
    onSaveDraft: (req: MeldungDraftRequest) => Promise<MeldungResponse | void>;
    onSubmit: (mirrorToNotizen: boolean) => Promise<void>;
}) {
    const { value, disabled = false, onSaveDraft, onSubmit } = props;

    const [form, setForm] = React.useState<MeldungDraftRequest>(() => toDraftFromResponse(value));
    const [saving, setSaving] = React.useState(false);
    const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
    const [submitMirror, setSubmitMirror] = React.useState(true);
    const [validationErr, setValidationErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        setForm(toDraftFromResponse(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(value as any).id]);

    const set = <K extends keyof MeldungDraftRequest>(k: K, v: MeldungDraftRequest[K]) =>
        setForm((s) => ({ ...s, [k]: v }));

    const toggleAnlass = (code: string) => {
        const cur = new Set((form as any).anlassCodes || []);
        if (cur.has(code)) cur.delete(code);
        else cur.add(code);
        set("anlassCodes" as any, Array.from(cur) as any);
    };

    // Observations helpers
    const addObservation = () => {
        const obs = {
            zeitpunkt: new Date().toISOString(),
            zeitraum: "EINMALIG",
            ort: "SCHULE_KITA",
            quelle: "EIGENE_WAHRNEHMUNG",
            sichtbarkeit: "INTERN",
            text: "",
            tags: [],
        };
        set("observations" as any, ([...(((form as any).observations || []) as any[]), obs] as any) as any);
    };

    const updateObs = (idx: number, patch: any) => {
        const arr = [...(((form as any).observations || []) as any[])];
        arr[idx] = { ...arr[idx], ...patch };
        set("observations" as any, arr as any);
    };

    const removeObs = (idx: number) => {
        const arr = [...(((form as any).observations || []) as any[])];
        arr.splice(idx, 1);
        set("observations" as any, arr as any);
    };

    const addObsTag = (idx: number) => {
        const arr = [...(((form as any).observations || []) as any[])];
        const tags = [...((arr[idx].tags || []) as any[])];
        tags.push({
            anlassCode: (((form as any).anlassCodes || [])[0] ?? null) as any,
            indicatorId: null,
            severity: 0,
            comment: null,
        });
        arr[idx] = { ...arr[idx], tags };
        set("observations" as any, arr as any);
    };

    const updateObsTag = (obsIdx: number, tagIdx: number, patch: any) => {
        const arr = [...(((form as any).observations || []) as any[])];
        const tags = [...((arr[obsIdx].tags || []) as any[])];
        tags[tagIdx] = { ...tags[tagIdx], ...patch };
        arr[obsIdx] = { ...arr[obsIdx], tags };
        set("observations" as any, arr as any);
    };

    const removeObsTag = (obsIdx: number, tagIdx: number) => {
        const arr = [...(((form as any).observations || []) as any[])];
        const tags = [...((arr[obsIdx].tags || []) as any[])];
        tags.splice(tagIdx, 1);
        arr[obsIdx] = { ...arr[obsIdx], tags };
        set("observations" as any, arr as any);
    };

    // Contacts / Extern / Attachments / sectionReasons
    const addContact = () => {
        const next = [...(((form as any).contacts || []) as any[])];
        next.push({
            kontaktMit: "SONSTIGE",
            kontaktAm: new Date().toISOString(),
            status: "GEPLANT",
            notiz: null,
            ergebnis: null,
        });
        set("contacts" as any, next as any);
    };

    const updateContact = (idx: number, patch: any) => {
        const next = [...(((form as any).contacts || []) as any[])];
        next[idx] = { ...next[idx], ...patch };
        set("contacts" as any, next as any);
    };

    const removeContact = (idx: number) => {
        const next = [...(((form as any).contacts || []) as any[])];
        next.splice(idx, 1);
        set("contacts" as any, next as any);
    };

    const addExtern = () => {
        const next = [...(((form as any).extern || []) as any[])];
        next.push({
            stelle: "SONSTIGE",
            stelleSonstiges: null,
            am: new Date().toISOString(),
            begruendung: null,
            ergebnis: null,
        });
        set("extern" as any, next as any);
    };

    const updateExtern = (idx: number, patch: any) => {
        const next = [...(((form as any).extern || []) as any[])];
        next[idx] = { ...next[idx], ...patch };
        set("extern" as any, next as any);
    };

    const removeExtern = (idx: number) => {
        const next = [...(((form as any).extern || []) as any[])];
        next.splice(idx, 1);
        set("extern" as any, next as any);
    };

    const addAttachment = () => {
        const next = [...(((form as any).attachments || []) as any[])];
        next.push({
            fileId: null,
            typ: "DOKUMENT",
            titel: null,
            beschreibung: null,
            sichtbarkeit: "INTERN",
            rechtsgrundlageHinweis: null,
        });
        set("attachments" as any, next as any);
    };

    const updateAttachment = (idx: number, patch: any) => {
        const next = [...(((form as any).attachments || []) as any[])];
        next[idx] = { ...next[idx], ...patch };
        set("attachments" as any, next as any);
    };

    const removeAttachment = (idx: number) => {
        const next = [...(((form as any).attachments || []) as any[])];
        next.splice(idx, 1);
        set("attachments" as any, next as any);
    };

    const setSectionReason = (key: string, reason: string | null) => {
        const cur = { ...(((form as any).sectionReasons || {}) as Record<string, string>) };
        if (!reason || reason.trim().length === 0) delete cur[key];
        else cur[key] = reason;
        set("sectionReasons" as any, cur as any);
    };

    // ✅ Auto assessment + auto-derivation of abweichungZurAuto (kept in sync)
    const auto = React.useMemo(() => computeAutoAssessment(form), [form]);
    const fachAmpel = (form as any).fachAmpel as string | null;
    const abwComputed = React.useMemo(() => computeAbweichungZurAuto(fachAmpel, auto.autoAmpel), [fachAmpel, auto.autoAmpel]);

    React.useEffect(() => {
        // Keep draft field aligned unless user already has a value (we treat it as derived anyway)
        const cur = (form as any).abweichungZurAuto as string | null | undefined;
        if (!cur || cur !== abwComputed) {
            set("abweichungZurAuto" as any, abwComputed as any);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [abwComputed]);

    // ✅ Risk-based Pflichtfeldlogik (Submit)
    const validateForSubmitUI = (): string | null => {
        const kd = String((form as any).kurzbeschreibung ?? "").trim();
        if (kd.length === 0) return "Kurzbeschreibung fehlt.";

        const obs = (((form as any).observations || []) as any[]).filter(Boolean);
        if (obs.length === 0) return "Mindestens eine Beobachtung (Observation) ist erforderlich.";
        if (obs.some((o) => String(o?.text ?? "").trim().length === 0)) return "Es gibt Beobachtungen ohne Text.";

        // If Gefahr im Verzug => Akutbegründung required
        if ((form as any).akutGefahrImVerzug && String((form as any).akutBegruendung ?? "").trim().length === 0) {
            return "Akut-Begründung ist erforderlich, wenn Gefahr im Verzug gesetzt ist.";
        }

        // Final risk: prefer fachAmpel if set, else autoAmpel
        const finalAmpel = (fachAmpel ?? auto.autoAmpel) as string;

        // For submit we require fach fields always (transparent §8a)
        if (!fachAmpel) return "Fachliche Ampel fehlt (Pflicht bei Submit).";
        if (String((form as any).fachText ?? "").trim().length === 0) return "Fachliche Begründung (Text) fehlt (Pflicht bei Submit).";

        // If ROT (high risk) => Jugendamt decision required + reason if not informed
        if (finalAmpel === "ROT") {
            const jug = (form as any).jugendamt;
            if (!jug?.informiert) return "Jugendamt-Entscheidung fehlt (bei ROT erforderlich).";
            if (jug.informiert !== "JA" && String(jug.begruendung ?? "").trim().length === 0) {
                return "Begründung beim Jugendamt ist erforderlich, wenn nicht informiert (bei ROT).";
            }
            // Also require akutKindSicherUntergebracht to be explicitly set (not null)
            if (!(form as any).akutKindSicherUntergebracht) {
                return "Angabe 'Kind sicher untergebracht' ist erforderlich (bei ROT).";
            }
            // Encourage at least one contact/external clarification (hard requirement here)
            const contacts = ((form as any).contacts || []) as any[];
            const extern = ((form as any).extern || []) as any[];
            if (contacts.length + extern.length === 0) {
                return "Mindestens ein Kontakt oder eine externe Abklärung ist erforderlich (bei ROT).";
            }
        }

        // If GELB (medium) => Jugendamt decision recommended; require if akute flags
        if (finalAmpel === "GELB") {
            const jug = (form as any).jugendamt;
            if ((form as any).akutGefahrImVerzug && !jug?.informiert) {
                return "Jugendamt-Entscheidung ist erforderlich, wenn Gefahr im Verzug gesetzt ist (auch bei GELB).";
            }
        }

        // Abweichung justification if deviating
        if ((form as any).abweichungZurAuto && (form as any).abweichungZurAuto !== "GLEICH") {
            if (String((form as any).abweichungsBegruendung ?? "").trim().length === 0) {
                return "Begründung der Abweichung ist erforderlich, wenn von der Vorbewertung abgewichen wird.";
            }
        }

        return null;
    };

    const doSave = async () => {
        setSaveMsg(null);
        setValidationErr(null);
        setSaving(true);
        try {
            await onSaveDraft(form);
            setSaveMsg("Gespeichert.");
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMsg(null), 2000);
        }
    };

    const doSubmit = async () => {
        const vErr = validateForSubmitUI();
        setValidationErr(vErr);
        if (vErr) return;
        await doSave();
        await onSubmit(submitMirror);
    };

    const statusIsDone = String((value as any).status || "").toUpperCase().includes("ABGESCHLOSSEN");

    const riskTone = (a: string) => {
        if (a === "ROT") return "danger";
        if (a === "GELB") return "warning";
        return "success";
    };

    return (
        <div className="space-y-4">
            {statusIsDone && (
                <Alert>
                    <AlertTitle>Abgeschlossen</AlertTitle>
                    <AlertDescription>Diese Version ist abgeschlossen und nicht mehr editierbar.</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">v{(value as any).versionNo}</Badge>
                {(value as any).current ? <Badge tone="info">current</Badge> : null}
                <Badge tone={statusIsDone ? "success" : "info"}>{String((value as any).status ?? "")}</Badge>

                <Separator className="mx-2 hidden sm:block" />

                {/* ✅ Auto assessment UI */}
                <Badge tone={riskTone(auto.autoAmpel)}>Auto: {AMPEL_LABEL[auto.autoAmpel]}</Badge>
                <Badge variant="secondary">Score: {auto.score}</Badge>
                <span className="text-xs text-muted-foreground hidden sm:inline">{auto.rationale}</span>
            </div>

            <Tabs defaultValue="basis">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                    <TabsTrigger value="basis">Basis</TabsTrigger>
                    <TabsTrigger value="anlass">Anlässe</TabsTrigger>
                    <TabsTrigger value="obs">Beobachtungen</TabsTrigger>
                    <TabsTrigger value="fach">Fachbewertung</TabsTrigger>
                    <TabsTrigger value="akut">Akut / Schutz</TabsTrigger>
                    <TabsTrigger value="planung">Planung</TabsTrigger>
                    <TabsTrigger value="doku">Dokumentation</TabsTrigger>
                </TabsList>

                {/* BASIS */}
                <TabsContent value="basis" className="mt-4 space-y-4">
                    <Alert>
                        <AlertTitle>Erfassung / Eingangshinweis</AlertTitle>
                        <AlertDescription>
                            Dokumentation im Kontext des Schutzauftrags nach § 8a SGB VIII: sachlich, nachvollziehbar, fallbezogen.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Erfasst von (Rolle)</Label>
                            <Input
                                value={String((form as any).erfasstVonRolle ?? "")}
                                onChange={(e) => set("erfasstVonRolle" as any, e.target.value as any)}
                                disabled={disabled || statusIsDone}
                                placeholder="z. B. Lehrkraft, Schulsozialarbeit…"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Meldeweg</Label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={String((form as any).meldeweg ?? "TELEFON")}
                                onChange={(e) => set("meldeweg" as any, pick(e.target.value, MELDEWEG, "TELEFON") as any)}
                                disabled={disabled || statusIsDone}
                            >
                                {MELDEWEG.map((m) => (
                                    <option key={m} value={m}>
                                        {MELDEWEG_LABEL[m]}
                                    </option>
                                ))}
                            </select>

                            {String((form as any).meldeweg) === "SONSTIGES" ? (
                                <Input
                                    value={String((form as any).meldewegSonstiges ?? "")}
                                    onChange={(e) => set("meldewegSonstiges" as any, (e.target.value || null) as any)}
                                    disabled={disabled || statusIsDone}
                                    placeholder="Bitte spezifizieren…"
                                />
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label>Dringlichkeit</Label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={String((form as any).dringlichkeit ?? "UNKLAR")}
                                onChange={(e) => set("dringlichkeit" as any, pick(e.target.value, DRING, "UNKLAR") as any)}
                                disabled={disabled || statusIsDone}
                            >
                                {DRING.map((d) => (
                                    <option key={d} value={d}>
                                        {DRING_LABEL[d]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Datenbasis</Label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={String((form as any).datenbasis ?? "UNKLAR")}
                                onChange={(e) => set("datenbasis" as any, pick(e.target.value, DATENB, "UNKLAR") as any)}
                                disabled={disabled || statusIsDone}
                            >
                                {DATENB.map((d) => (
                                    <option key={d} value={d}>
                                        {DATENB_LABEL[d]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Informationsquelle / Kontakt (optional)</Label>
                            <Input
                                value={String((form as any).meldendeStelleKontakt ?? "")}
                                onChange={(e) => set("meldendeStelleKontakt" as any, (e.target.value || null) as any)}
                                disabled={disabled || statusIsDone}
                                placeholder="Name / Telefon / Institution…"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center justify-between rounded-xl border border-border p-3">
                                <div>
                                    <div className="font-medium">Einwilligung vorhanden</div>
                                    <div className="text-xs text-muted-foreground">Optional, je nach Lage/Erforderlichkeit</div>
                                </div>
                                <Switch
                                    checked={!!(form as any).einwilligungVorhanden}
                                    onCheckedChange={(v) => set("einwilligungVorhanden" as any, v as any)}
                                    disabled={disabled || statusIsDone}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-xl border border-border p-3">
                                <div>
                                    <div className="font-medium">Schweigepflichtentbindung vorhanden</div>
                                    <div className="text-xs text-muted-foreground">Dokumentationshinweis; Upload separat</div>
                                </div>
                                <Switch
                                    checked={!!(form as any).schweigepflichtentbindungVorhanden}
                                    onCheckedChange={(v) => set("schweigepflichtentbindungVorhanden" as any, v as any)}
                                    disabled={disabled || statusIsDone}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Kurzbeschreibung (Pflicht)</Label>
                        <Textarea
                            value={String((form as any).kurzbeschreibung ?? "")}
                            onChange={(e) => set("kurzbeschreibung" as any, e.target.value as any)}
                            disabled={disabled || statusIsDone}
                            placeholder="Was ist passiert / was wurde beobachtet / warum wird gemeldet?"
                            rows={5}
                        />
                    </div>
                </TabsContent>

                {/* ANLASS */}
                <TabsContent value="anlass" className="mt-4 space-y-4">
                    <Alert>
                        <AlertTitle>Anlass-Katalog</AlertTitle>
                        <AlertDescription>Auswahl wird als Codes dokumentiert und in Tags/Beobachtungen referenziert.</AlertDescription>
                    </Alert>

                    <div className="space-y-5">
                        {ANLASS_CATALOG.map((cat) => (
                            <div key={cat.key} className="space-y-2">
                                <div className="text-sm font-semibold">{cat.title}</div>
                                <div className="flex flex-wrap gap-2">
                                    {cat.items.map(({ code, label }) => {
                                        const active = (((form as any).anlassCodes || []) as string[]).includes(code);
                                        return (
                                            <button
                                                key={code}
                                                onClick={() => toggleAnlass(code)}
                                                disabled={disabled || statusIsDone}
                                                title={code}
                                                className={[
                                                    "rounded-full border px-3 py-1 text-sm transition",
                                                    active ? "border-primary bg-accent" : "border-border hover:bg-accent/60",
                                                ].join(" ")}
                                                type="button"
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                        Ausgewählt: <Badge variant="secondary">{(((form as any).anlassCodes || []) as any[]).length}</Badge>
                    </div>
                </TabsContent>

                {/* OBSERVATIONS */}
                <TabsContent value="obs" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Beobachtungen (Observations)</div>
                            <div className="text-sm text-muted-foreground">
                                Jede Beobachtung kann Tags (Anlass/Indikator/Severity) enthalten – Grundlage für Auto-Vorbewertung.
                            </div>
                        </div>
                        <Button onClick={addObservation} disabled={disabled || statusIsDone}>
                            + Observation
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {((((form as any).observations || []) as any[]) || []).map((o: any, idx: number) => (
                            <Card key={idx} className="rounded-2xl">
                                <CardHeader className="flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base">Observation #{idx + 1}</CardTitle>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {o.zeitpunkt ? new Date(o.zeitpunkt).toLocaleString() : "—"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addObsTag(idx)}
                                            disabled={disabled || statusIsDone}
                                            type="button"
                                        >
                                            + Tag
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => removeObs(idx)}
                                            disabled={disabled || statusIsDone}
                                            type="button"
                                        >
                                            Entfernen
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                        <div className="space-y-1">
                                            <Label>Zeitraum</Label>
                                            <select
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={o.zeitraum ?? "UNBEKANNT"}
                                                onChange={(e) => updateObs(idx, { zeitraum: pick(e.target.value, OBS_ZEITRAUM, "UNBEKANNT") })}
                                                disabled={disabled || statusIsDone}
                                            >
                                                {OBS_ZEITRAUM.map((z) => (
                                                    <option key={z} value={z}>
                                                        {OBS_ZEITRAUM_LABEL[z]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Ort</Label>
                                            <select
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={o.ort ?? "SONSTIGES"}
                                                onChange={(e) => updateObs(idx, { ort: pick(e.target.value, OBS_ORT, "SONSTIGES") })}
                                                disabled={disabled || statusIsDone}
                                            >
                                                {OBS_ORT.map((x) => (
                                                    <option key={x} value={x}>
                                                        {OBS_ORT_LABEL[x]}
                                                    </option>
                                                ))}
                                            </select>
                                            {o.ort === "SONSTIGES" ? (
                                                <Input
                                                    value={o.ortSonstiges ?? ""}
                                                    onChange={(e) => updateObs(idx, { ortSonstiges: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                    placeholder="Ort spezifizieren…"
                                                />
                                            ) : null}
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Quelle</Label>
                                            <select
                                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                value={o.quelle ?? "UNBEKANNT"}
                                                onChange={(e) => updateObs(idx, { quelle: pick(e.target.value, OBS_QUELLE, "UNBEKANNT") })}
                                                disabled={disabled || statusIsDone}
                                            >
                                                {OBS_QUELLE.map((q) => (
                                                    <option key={q} value={q}>
                                                        {OBS_QUELLE_LABEL[q]}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Text (Pflicht)</Label>
                                        <Textarea
                                            value={o.text ?? ""}
                                            onChange={(e) => updateObs(idx, { text: e.target.value })}
                                            disabled={disabled || statusIsDone}
                                            rows={4}
                                            placeholder="Sachlich, faktenorientiert. Wörtliche Zitate separat."
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label>Wörtliches Zitat</Label>
                                            <Textarea
                                                value={o.woertlichesZitat ?? ""}
                                                onChange={(e) => updateObs(idx, { woertlichesZitat: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Körperbefund (optional)</Label>
                                            <Textarea
                                                value={o.koerperbefund ?? ""}
                                                onChange={(e) => updateObs(idx, { koerperbefund: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label>Verhalten Kind</Label>
                                            <Textarea
                                                value={o.verhaltenKind ?? ""}
                                                onChange={(e) => updateObs(idx, { verhaltenKind: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Verhalten Bezugsperson</Label>
                                            <Textarea
                                                value={o.verhaltenBezug ?? ""}
                                                onChange={(e) => updateObs(idx, { verhaltenBezug: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                                rows={2}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label>Sichtbarkeit</Label>
                                        <select
                                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                            value={o.sichtbarkeit ?? "INTERN"}
                                            onChange={(e) => updateObs(idx, { sichtbarkeit: pick(e.target.value, SICHT, "INTERN") })}
                                            disabled={disabled || statusIsDone}
                                        >
                                            {SICHT.map((s) => (
                                                <option key={s} value={s}>
                                                    {SICHT_LABEL[s]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <Separator />

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="font-medium">Tags (Anlass / Indikator / Severity)</div>
                                            <Badge variant="secondary">{(o.tags || []).length}</Badge>
                                        </div>

                                        {(o.tags || []).length === 0 ? (
                                            <div className="text-sm text-muted-foreground">
                                                Keine Tags. Füge mindestens einen Indikator hinzu, damit das Instrument bewerten kann.
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {(o.tags || []).map((t: any, tIdx: number) => (
                                                    <div key={tIdx} className="rounded-xl border border-border p-3">
                                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
                                                            <div className="space-y-1">
                                                                <Label>Anlass</Label>
                                                                <select
                                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                                    value={t.anlassCode ?? ""}
                                                                    onChange={(e) => updateObsTag(idx, tIdx, { anlassCode: e.target.value || null })}
                                                                    disabled={disabled || statusIsDone}
                                                                >
                                                                    <option value="">—</option>
                                                                    {(((form as any).anlassCodes || ANLASS_CODES) as string[]).map((c) => (
                                                                        <option key={c} value={c}>
                                                                            {ANLASS_LABELS[c] ?? c}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="space-y-1 lg:col-span-2">
                                                                <Label>Indikator</Label>
                                                                <select
                                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                                    value={t.indicatorId ?? ""}
                                                                    onChange={(e) => updateObsTag(idx, tIdx, { indicatorId: e.target.value || null })}
                                                                    disabled={disabled || statusIsDone}
                                                                >
                                                                    <option value="">—</option>
                                                                    {INDICATORS.map((i) => (
                                                                        <option key={i.id} value={i.id}>
                                                                            {i.label} ({i.id})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="space-y-1">
                                                                <Label>Severity (0..3)</Label>
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={3}
                                                                    value={t.severity ?? 0}
                                                                    onChange={(e) => updateObsTag(idx, tIdx, { severity: clampSeverity(Number(e.target.value)) })}
                                                                    disabled={disabled || statusIsDone}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="mt-3 flex items-start gap-3">
                                                            <div className="flex-1 space-y-1">
                                                                <Label>Kommentar (optional)</Label>
                                                                <Textarea
                                                                    rows={2}
                                                                    value={t.comment ?? ""}
                                                                    onChange={(e) => updateObsTag(idx, tIdx, { comment: e.target.value || null })}
                                                                    disabled={disabled || statusIsDone}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => removeObsTag(idx, tIdx)}
                                                                disabled={disabled || statusIsDone}
                                                                type="button"
                                                            >
                                                                Entfernen
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* FACHBEWERTUNG */}
                <TabsContent value="fach" className="mt-4 space-y-4">
                    <Alert>
                        <AlertTitle>Fachliche Bewertung nach § 8a SGB VIII</AlertTitle>
                        <AlertDescription>
                            Die Auto-Vorbewertung ist eine Orientierung. Maßgeblich ist die begründete fachliche Einschätzung.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Vorbewertung & Abweichung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge tone={riskTone(auto.autoAmpel)}>Auto: {AMPEL_LABEL[auto.autoAmpel]}</Badge>
                                <Badge variant="secondary">Score: {auto.score}</Badge>
                                <span className="text-xs text-muted-foreground">{auto.rationale}</span>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <Label>Fach-Ampel (Pflicht bei Submit)</Label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={(form as any).fachAmpel ?? ""}
                                    onChange={(e) => set("fachAmpel" as any, e.target.value ? pick(e.target.value, AMPEL, "GRUEN") : null)}
                                    disabled={disabled || statusIsDone}
                                >
                                    <option value="">—</option>
                                    {AMPEL.map((a) => (
                                        <option key={a} value={a}>
                                            {AMPEL_LABEL[a]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label>Fachliche Begründung (Pflicht bei Submit)</Label>
                                <Textarea
                                    rows={5}
                                    value={(form as any).fachText ?? ""}
                                    onChange={(e) => set("fachText" as any, e.target.value as any)}
                                    disabled={disabled || statusIsDone}
                                    placeholder="Fallbezogene Herleitung: welche Beobachtungen/Indikatoren sind maßgeblich?"
                                />
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <Label>Abweichung zur Auto-Vorbewertung (automatisch abgeleitet)</Label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={String((form as any).abweichungZurAuto ?? "GLEICH")}
                                    onChange={(e) => set("abweichungZurAuto" as any, pick(e.target.value, ABW_AUTO, "GLEICH") as any)}
                                    disabled={disabled || statusIsDone}
                                >
                                    {ABW_AUTO.map((x) => (
                                        <option key={x} value={x}>
                                            {ABW_AUTO_LABEL[x]}
                                        </option>
                                    ))}
                                </select>

                                {(form as any).abweichungZurAuto !== "GLEICH" ? (
                                    <div className="space-y-1 mt-2">
                                        <Label>Begründung der Abweichung (Pflicht bei Abweichung)</Label>
                                        <Textarea
                                            rows={3}
                                            value={(form as any).abweichungsBegruendung ?? ""}
                                            onChange={(e) => set("abweichungsBegruendung" as any, e.target.value || null)}
                                            disabled={disabled || statusIsDone}
                                            placeholder="Warum weicht die fachliche Einschätzung ab?"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-1 mt-2">
                                        <Label>Begründung der Abweichung (optional)</Label>
                                        <Textarea
                                            rows={2}
                                            value={(form as any).abweichungsBegruendung ?? ""}
                                            onChange={(e) => set("abweichungsBegruendung" as any, e.target.value || null)}
                                            disabled={disabled || statusIsDone}
                                            placeholder="Optional"
                                        />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* AKUT / SCHUTZ + JUGENDAMT */}
                <TabsContent value="akut" className="mt-4 space-y-4">
                    {validationErr ? (
                        <Alert>
                            <AlertTitle>Unvollständig</AlertTitle>
                            <AlertDescription>{validationErr}</AlertDescription>
                        </Alert>
                    ) : null}

                    <Alert>
                        <AlertTitle>Akutprüfung / Schutzauftrag</AlertTitle>
                        <AlertDescription>
                            Sofortige Schutzaspekte (Gefahr im Verzug, Notruf, Unterbringung). Bei hoher Gefährdung: Jugendamt-Entscheidung dokumentieren.
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Akutindikatoren</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                                    <div>
                                        <div className="font-medium">Gefahr im Verzug</div>
                                        <div className="text-xs text-muted-foreground">Unmittelbarer Handlungsbedarf</div>
                                    </div>
                                    <Switch
                                        checked={!!(form as any).akutGefahrImVerzug}
                                        onCheckedChange={(v) => set("akutGefahrImVerzug" as any, v as any)}
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                                    <div>
                                        <div className="font-medium">Notruf erforderlich</div>
                                        <div className="text-xs text-muted-foreground">Optional</div>
                                    </div>
                                    <Switch
                                        checked={!!(form as any).akutNotrufErforderlich}
                                        onCheckedChange={(v) => set("akutNotrufErforderlich" as any, v as any)}
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>

                                <div className="space-y-1 rounded-xl border border-border p-3">
                                    <Label>Kind sicher untergebracht</Label>
                                    <select
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        value={String((form as any).akutKindSicherUntergebracht ?? "UNKLAR")}
                                        onChange={(e) =>
                                            set(
                                                "akutKindSicherUntergebracht" as any,
                                                pick(e.target.value, JANEINUNKLAR, "UNKLAR") as any
                                            )
                                        }
                                        disabled={disabled || statusIsDone}
                                    >
                                        {JANEINUNKLAR.map((x) => (
                                            <option key={x} value={x}>
                                                {JNU_LABEL[x]}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="text-xs text-muted-foreground">Aktuelle Schutz-/Betreuungslage</div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Akut-Begründung{(form as any).akutGefahrImVerzug ? " (Pflicht bei Gefahr im Verzug)" : " (optional)"}</Label>
                                <Textarea
                                    rows={3}
                                    value={(form as any).akutBegruendung ?? ""}
                                    onChange={(e) => set("akutBegruendung" as any, e.target.value || null)}
                                    disabled={disabled || statusIsDone}
                                    placeholder="Kurz: warum akut? welche Sofortmaßnahmen wurden/wären eingeleitet?"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Jugendamt</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label>Informiert?{((form as any).fachAmpel === "ROT" ? " (Pflicht bei ROT)" : " (optional)")} </Label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={(form as any).jugendamt?.informiert ?? ""}
                                    onChange={(e) =>
                                        set("jugendamt" as any, {
                                            ...((form as any).jugendamt || { informiert: "UNKLAR" }),
                                            informiert: pick(e.target.value, JUG_INF, "UNKLAR"),
                                        })
                                    }
                                    disabled={disabled || statusIsDone}
                                >
                                    <option value="">—</option>
                                    {JUG_INF.map((x) => (
                                        <option key={x} value={x}>
                                            {JUG_INF_LABEL[x]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div className="space-y-1">
                                    <Label>Kontaktart</Label>
                                    <select
                                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        value={(form as any).jugendamt?.kontaktart ?? ""}
                                        onChange={(e) =>
                                            set("jugendamt" as any, {
                                                ...((form as any).jugendamt || { informiert: "UNKLAR" }),
                                                kontaktart: e.target.value ? pick(e.target.value, JUG_KONTAKTART, "TELEFON") : null,
                                            })
                                        }
                                        disabled={disabled || statusIsDone}
                                    >
                                        <option value="">—</option>
                                        {JUG_KONTAKTART.map((x) => (
                                            <option key={x} value={x}>
                                                {JUG_KONTAKTART_LABEL[x]}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <Label>Kontakt am (Instant/ISO)</Label>
                                    <Input
                                        value={(form as any).jugendamt?.kontaktAm ?? ""}
                                        onChange={(e) =>
                                            set("jugendamt" as any, {
                                                ...((form as any).jugendamt || { informiert: "UNKLAR" }),
                                                kontaktAm: e.target.value || null,
                                            })
                                        }
                                        disabled={disabled || statusIsDone}
                                        placeholder="2026-03-04T10:30:00Z"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Aktenzeichen</Label>
                                <Input
                                    value={(form as any).jugendamt?.aktenzeichen ?? ""}
                                    onChange={(e) =>
                                        set("jugendamt" as any, {
                                            ...((form as any).jugendamt || { informiert: "UNKLAR" }),
                                            aktenzeichen: e.target.value || null,
                                        })
                                    }
                                    disabled={disabled || statusIsDone}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label>
                                    Begründung
                                    {(String((form as any).jugendamt?.informiert || "") !== "JA" &&
                                    String((form as any).jugendamt?.informiert || "") !== ""
                                        ? " (Pflicht wenn nicht JA)"
                                        : " (optional)")}
                                </Label>
                                <Textarea
                                    rows={3}
                                    value={(form as any).jugendamt?.begruendung ?? ""}
                                    onChange={(e) =>
                                        set("jugendamt" as any, {
                                            ...((form as any).jugendamt || { informiert: "UNKLAR" }),
                                            begruendung: e.target.value || null,
                                        })
                                    }
                                    disabled={disabled || statusIsDone}
                                    placeholder="Kurz: warum (nicht) informiert / welche Abwägung?"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Speichern / Abschließen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={doSave} disabled={disabled || statusIsDone || saving} type="button">
                                    {saving ? "Speichere…" : "Draft speichern"}
                                </Button>
                                {saveMsg ? <span className="text-sm text-muted-foreground">{saveMsg}</span> : null}
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-3 rounded-xl border border-border p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Observations → Notizen spiegeln</div>
                                        <div className="text-xs text-muted-foreground">Empfohlen</div>
                                    </div>
                                    <Switch checked={submitMirror} onCheckedChange={setSubmitMirror} disabled={disabled || statusIsDone} />
                                </div>

                                <Button onClick={doSubmit} disabled={disabled || statusIsDone || saving} type="button">
                                    Abschließen (Submit)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PLANUNG */}
                <TabsContent value="planung" className="mt-4 space-y-4">
                    <Alert>
                        <AlertTitle>Weiteres Vorgehen / Verlaufssicherung</AlertTitle>
                        <AlertDescription>
                            Zuständigkeit und nächste Überprüfung zur fallbezogenen Steuerung (Schutzauftrag nach § 8a SGB VIII).
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Verantwortliche Fachkraft (UserId)</Label>
                            <Input
                                value={(form as any).verantwortlicheFachkraftUserId ?? ""}
                                onChange={(e) => {
                                    const raw = e.target.value.trim();
                                    set("verantwortlicheFachkraftUserId" as any, raw ? Number(raw) : null);
                                }}
                                disabled={disabled || statusIsDone}
                                placeholder="z. B. 12345"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Nächste Überprüfung am (LocalDate)</Label>
                            <Input
                                type="date"
                                value={String((form as any).naechsteUeberpruefungAm ?? "").slice(0, 10)}
                                onChange={(e) => set("naechsteUeberpruefungAm" as any, e.target.value ? e.target.value : null)}
                                disabled={disabled || statusIsDone}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Zusammenfassung</Label>
                        <Textarea
                            rows={4}
                            value={(form as any).zusammenfassung ?? ""}
                            onChange={(e) => set("zusammenfassung" as any, e.target.value || null)}
                            disabled={disabled || statusIsDone}
                            placeholder="Kurz, sachlich: Kernaussagen, Bewertung, nächste Schritte."
                        />
                    </div>
                </TabsContent>

                {/* DOKU: contacts / extern / attachments / sectionReasons */}
                <TabsContent value="doku" className="mt-4 space-y-6">
                    <Alert>
                        <AlertTitle>Dokumentation / Nachvollziehbarkeit</AlertTitle>
                        <AlertDescription>
                            Kontakte, externe Abklärungen und Unterlagen sind zentrale Belege/Herleitung. Zusätzlich: Begründungen je Sektion (sectionReasons).
                        </AlertDescription>
                    </Alert>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Begründungen je Sektion (sectionReasons)</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                ["basis", "Basis / Meldedaten"],
                                ["anlass", "Anlässe"],
                                ["obs", "Beobachtungen"],
                                ["fach", "Fachbewertung"],
                                ["akut", "Akut / Jugendamt"],
                                ["planung", "Planung"],
                                ["doku", "Dokumentation"],
                            ].map(([key, label]) => (
                                <div key={key} className="space-y-1">
                                    <Label>{label}: Dokumentationsbegründung</Label>
                                    <Textarea
                                        rows={2}
                                        value={(((form as any).sectionReasons || {}) as Record<string, string>)[key] ?? ""}
                                        onChange={(e) => setSectionReason(key, e.target.value)}
                                        disabled={disabled || statusIsDone}
                                        placeholder="Warum ist die Dokumentation so/ggf. warum fehlen Informationen?"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Contacts */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base">Kontakte</CardTitle>
                            <Button onClick={addContact} disabled={disabled || statusIsDone} type="button">
                                + Kontakt
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {((((form as any).contacts || []) as any[]) || []).length === 0 ? (
                                <div className="text-sm text-muted-foreground">Keine Kontakte erfasst.</div>
                            ) : (
                                (((form as any).contacts || []) as any[]).map((c: any, idx: number) => (
                                    <div key={idx} className="rounded-xl border border-border p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium">Kontakt #{idx + 1}</div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeContact(idx)}
                                                disabled={disabled || statusIsDone}
                                                type="button"
                                            >
                                                Entfernen
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Kontakt mit</Label>
                                                <select
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    value={c.kontaktMit ?? "SONSTIGE"}
                                                    onChange={(e) => updateContact(idx, { kontaktMit: pick(e.target.value, KONTAKT_MIT, "SONSTIGE") })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    {KONTAKT_MIT.map((k) => (
                                                        <option key={k} value={k}>
                                                            {KONTAKT_MIT_LABEL[k]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Kontakt am (Instant/ISO)</Label>
                                                <Input
                                                    value={c.kontaktAm ?? ""}
                                                    onChange={(e) => updateContact(idx, { kontaktAm: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                    placeholder="2026-03-04T10:30:00Z"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Status</Label>
                                                <select
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    value={c.status ?? "GEPLANT"}
                                                    onChange={(e) => updateContact(idx, { status: pick(e.target.value, KONTAKT_STATUS, "GEPLANT") })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    {KONTAKT_STATUS.map((k) => (
                                                        <option key={k} value={k}>
                                                            {KONTAKT_STATUS_LABEL[k]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Ergebnis</Label>
                                                <Input
                                                    value={c.ergebnis ?? ""}
                                                    onChange={(e) => updateContact(idx, { ergebnis: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                    placeholder="Kernresultat"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Notiz / Kurzprotokoll</Label>
                                            <Textarea
                                                rows={3}
                                                value={c.notiz ?? ""}
                                                onChange={(e) => updateContact(idx, { notiz: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                                placeholder="Sachlich: relevante Aussagen, Vereinbarungen, Beobachtungen."
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Extern */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base">Externe Abklärungen</CardTitle>
                            <Button onClick={addExtern} disabled={disabled || statusIsDone} type="button">
                                + Extern
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {((((form as any).extern || []) as any[]) || []).length === 0 ? (
                                <div className="text-sm text-muted-foreground">Keine externen Abklärungen erfasst.</div>
                            ) : (
                                (((form as any).extern || []) as any[]).map((x: any, idx: number) => (
                                    <div key={idx} className="rounded-xl border border-border p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium">Extern #{idx + 1}</div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeExtern(idx)}
                                                disabled={disabled || statusIsDone}
                                                type="button"
                                            >
                                                Entfernen
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>Stelle</Label>
                                                <select
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    value={x.stelle ?? "SONSTIGE"}
                                                    onChange={(e) => updateExtern(idx, { stelle: pick(e.target.value, EXTERN_STELLE, "SONSTIGE") })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    {EXTERN_STELLE.map((s) => (
                                                        <option key={s} value={s}>
                                                            {EXTERN_STELLE_LABEL[s]}
                                                        </option>
                                                    ))}
                                                </select>

                                                {x.stelle === "SONSTIGE" ? (
                                                    <Input
                                                        value={x.stelleSonstiges ?? ""}
                                                        onChange={(e) => updateExtern(idx, { stelleSonstiges: e.target.value || null })}
                                                        disabled={disabled || statusIsDone}
                                                        placeholder="Stelle spezifizieren"
                                                    />
                                                ) : null}
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Am (Instant/ISO)</Label>
                                                <Input
                                                    value={x.am ?? ""}
                                                    onChange={(e) => updateExtern(idx, { am: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Ergebnis</Label>
                                                <Input
                                                    value={x.ergebnis ?? ""}
                                                    onChange={(e) => updateExtern(idx, { ergebnis: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Begründung / Anlass</Label>
                                                <Textarea
                                                    rows={2}
                                                    value={x.begruendung ?? ""}
                                                    onChange={(e) => updateExtern(idx, { begruendung: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>

                    {/* Attachments */}
                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-base">Unterlagen / Anhänge</CardTitle>
                            <Button onClick={addAttachment} disabled={disabled || statusIsDone} type="button">
                                + Anhang
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {((((form as any).attachments || []) as any[]) || []).length === 0 ? (
                                <div className="text-sm text-muted-foreground">Keine Anhänge erfasst.</div>
                            ) : (
                                (((form as any).attachments || []) as any[]).map((a: any, idx: number) => (
                                    <div key={idx} className="rounded-xl border border-border p-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="font-medium">Anhang #{idx + 1}</div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => removeAttachment(idx)}
                                                disabled={disabled || statusIsDone}
                                                type="button"
                                            >
                                                Entfernen
                                            </Button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                            <div className="space-y-1">
                                                <Label>FileId (Long)</Label>
                                                <Input
                                                    value={a.fileId ?? ""}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.trim();
                                                        updateAttachment(idx, { fileId: raw ? Number(raw) : null });
                                                    }}
                                                    disabled={disabled || statusIsDone}
                                                    placeholder="Backend-Datei-ID"
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Typ</Label>
                                                <select
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    value={a.typ ?? "DOKUMENT"}
                                                    onChange={(e) => updateAttachment(idx, { typ: pick(e.target.value, ATTACH_TYP, "DOKUMENT") })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    {ATTACH_TYP.map((t) => (
                                                        <option key={t} value={t}>
                                                            {ATTACH_TYP_LABEL[t]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Titel</Label>
                                                <Input
                                                    value={a.titel ?? ""}
                                                    onChange={(e) => updateAttachment(idx, { titel: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label>Sichtbarkeit</Label>
                                                <select
                                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                                    value={a.sichtbarkeit ?? "INTERN"}
                                                    onChange={(e) => updateAttachment(idx, { sichtbarkeit: pick(e.target.value, SICHT, "INTERN") })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    {SICHT.map((s) => (
                                                        <option key={s} value={s}>
                                                            {SICHT_LABEL[s]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Beschreibung</Label>
                                            <Textarea
                                                rows={2}
                                                value={a.beschreibung ?? ""}
                                                onChange={(e) => updateAttachment(idx, { beschreibung: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label>Rechtsgrundlage / Hinweis (Sozialdatenschutz, § 8a SGB VIII)</Label>
                                            <Textarea
                                                rows={2}
                                                value={a.rechtsgrundlageHinweis ?? ""}
                                                onChange={(e) => updateAttachment(idx, { rechtsgrundlageHinweis: e.target.value || null })}
                                                disabled={disabled || statusIsDone}
                                                placeholder="Zweckbindung/Erforderlichkeit, Zugriff/Sichtbarkeit"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}