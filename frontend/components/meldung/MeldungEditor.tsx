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

import { FileText, X } from "lucide-react";

function clampSeverity(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(3, Math.round(n)));
}

function formatBytes(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let v = bytes;
    while (v >= 1024 && idx < units.length - 1) {
        v = v / 1024;
        idx++;
    }
    const rounded = idx === 0 ? Math.round(v) : Math.round(v * 10) / 10;
    return `${rounded} ${units[idx]}`;
}

function formatFileType(file: File): string {
    // "application/pdf" => "PDF", etc.
    const t = (file.type || "").toLowerCase();
    if (!t) return "Datei";
    if (t === "application/pdf") return "PDF";
    if (t.startsWith("image/")) return "Bild";
    if (t.startsWith("text/")) return "Text";
    return t;
}

type UploadInfoListProps = {
    title?: string;
    files: File[];
    onUploadClick: () => void;
    onRemoveAt: (idx: number) => void;
    disabled?: boolean;
};

function UploadInfoList({
                            title = "Unterlagen",
                            files,
                            onUploadClick,
                            onRemoveAt,
                            disabled = false,
                        }: UploadInfoListProps) {
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">{title}</div>
                <Button type="button" variant="outline" size="sm" onClick={onUploadClick} disabled={disabled}>
                    Unterlagen hochladen
                </Button>
            </div>

            {files.length === 0 ? (
                <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
                    Keine Unterlagen ausgewählt.
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{files.length} Datei(en) ausgewählt</div>

                    <div className="space-y-1">
                        {files.map((file, idx) => (
                            <div
                                key={`${file.name}-${file.size}-${file.lastModified}-${idx}`}
                                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-2 py-2"
                            >
                                <div className="flex min-w-0 items-start gap-2">
                                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <div className="truncate text-sm">{file.name}</div>
                                        <div className="mt-0.5 text-xs text-muted-foreground">
                                            {formatFileType(file)} · {formatBytes(file.size)}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemoveAt(idx)}
                                    disabled={disabled}
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    title="Entfernen"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="text-[11px] leading-snug text-muted-foreground">
                        Hinweis: Upload ist aktuell nur eine UI-Info (keine Speicherung).
                    </div>
                </div>
            )}
        </div>
    );
}

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
    {
        key: "PSY",
        title: "Psychische / emotionale Anlässe",
        items: [
            { code: "PSY_WITHDRAWAL", label: "Sozialer Rückzug" },
            { code: "PSY_ANXIETY", label: "Ausgeprägte Ängstlichkeit" },
            { code: "PSY_DEPRESSIVE", label: "Depressive Symptome" },
            { code: "PSY_DISSOCIATION", label: "Dissoziatives Verhalten" },
            { code: "PSY_PARENTIFICATION", label: "Parentifizierung (Übernahme elterlicher Rolle)" },
            { code: "PSY_AGGRESSION", label: "Aggressives Verhalten" },
            { code: "PSY_MOOD_SWINGS", label: "Starke Stimmungsschwankungen" },
            { code: "PSY_SELF_DEVALUATION", label: "Selbstabwertung" },
            { code: "PSY_FEAR_OF_PERSON", label: "Angst vor bestimmter Person" },
            { code: "PSY_ATTACHMENT", label: "Bindungsauffälligkeiten" },
        ],
    },
    {
        key: "VIO",
        title: "Hinweise auf Gewalt",
        items: [
            { code: "VIO_CHILD_STATEMENT", label: "Aussage des Kindes zu Gewalt" },
            { code: "VIO_DV_STATEMENT", label: "Hinweis auf häusliche Gewalt" },
            { code: "VIO_THREATS", label: "Bedrohungen" },
            { code: "VIO_PSYCH", label: "Psychische Gewalt" },
            { code: "VIO_SEXUALIZED_BEHAVIOR", label: "Sexualisiertes Verhalten" },
            { code: "VIO_SEXUAL_STATEMENT", label: "Aussage zu sexualisierter Gewalt" },
            { code: "VIO_DIGITAL_SEX", label: "Digitale sexualisierte Übergriffe" },
        ],
    },
    {
        key: "NEG",
        title: "Vernachlässigungsanzeichen",
        items: [
            { code: "NEG_ABSENCE", label: "Auffällige Fehlzeiten" },
            { code: "NEG_UNPUNCTUAL", label: "Häufige Unpünktlichkeit" },
            { code: "NEG_NO_SUPERVISION", label: "Fehlende Aufsicht" },
            { code: "NEG_BASIC_NEEDS", label: "Grundbedürfnisse nicht gedeckt" },
            { code: "NEG_PARENT_OVERLOAD", label: "Überforderung der Eltern" },
            { code: "NEG_HOUSING", label: "Unzureichende Wohnsituation" },
            { code: "NEG_DEV_DELAY", label: "Entwicklungsverzögerung" },
        ],
    },
    {
        key: "CTX",
        title: "Kontextbezogene Anlässe (Eltern / Haushalt)",
        items: [
            { code: "CTX_SUBSTANCE", label: "Suchtproblematik im Haushalt" },
            { code: "CTX_MENTAL_ILLNESS", label: "Psychische Erkrankung im Haushalt" },
            { code: "CTX_SEPARATION_CONFLICT", label: "Trennungs-/Scheidungskonflikt" },
            { code: "CTX_POLICE", label: "Polizeieinsatz im Kontext" },
            { code: "CTX_PRIOR_CASES", label: "Frühere Jugendhilfefälle" },
            { code: "CTX_CHANGING_CARE", label: "Wechselnde Betreuungssituationen" },
            { code: "CTX_PARENT_CONFLICT", label: "Elternkonflikte" },
        ],
    },
    {
        key: "EXT",
        title: "Externe Mitteilungen",
        items: [
            { code: "EXT_BY_PEER", label: "Mitteilung durch Mitschüler/in" },
            { code: "EXT_BY_PARENTS", label: "Mitteilung durch Eltern" },
            { code: "EXT_BY_POLICE", label: "Mitteilung durch Polizei" },
            { code: "EXT_BY_MEDICAL", label: "Mitteilung durch medizinische Stelle" },
            { code: "EXT_BY_YOUTH_OFFICE", label: "Mitteilung durch Jugendamt" },
            { code: "EXT_BY_COUNSELING", label: "Mitteilung durch Beratungsstelle" },
            { code: "EXT_ANON", label: "Anonyme Mitteilung" },
            { code: "EXT_SELF", label: "Selbstmeldung des Kindes" },
        ],
    },
    {
        key: "EDU",
        title: "Schul-/Kita-spezifische Anlässe",
        items: [
            { code: "EDU_PERFORMANCE_DROP", label: "Leistungsabfall" },
            { code: "EDU_BEHAVIOR_CHANGE", label: "Verhaltensveränderung" },
            { code: "EDU_SEXUAL_PLAY", label: "Sexualisiertes Spielverhalten" },
            { code: "EDU_AGGRESSION_OTHERS", label: "Aggression gegenüber anderen" },
            { code: "EDU_EXHAUSTION", label: "Erschöpfung" },
            { code: "EDU_NO_MATERIALS", label: "Fehlende Lernmaterialien" },
            { code: "EDU_HUNGER", label: "Hungeranzeichen" },
            { code: "EDU_DEV_UNCLARIFIED", label: "Unklare Entwicklungsauffälligkeit" },
        ],
    },
    {
        key: "ACUTE",
        title: "Akutindikatoren",
        items: [
            { code: "ACUTE_CURRENT_ABUSE", label: "Aktuelle Misshandlung" },
            { code: "ACUTE_THREAT", label: "Konkrete Bedrohung" },
            { code: "ACUTE_FEAR_RETURN", label: "Angst vor Rückkehr nach Hause" },
            { code: "ACUTE_SEVERE_INJURY", label: "Schwere Verletzung" },
            { code: "ACUTE_SUICIDALITY", label: "Suizidalität" },
        ],
    },
    {
        key: "OTHER",
        title: "Sonstiges",
        items: [{ code: "OTHER", label: "Sonstiges" }],
    },
];

const ANLASS_CODES: string[] = ANLASS_CATALOG.flatMap((c) => c.items.map((i) => i.code));
const ANLASS_LABELS: Record<string, string> = Object.fromEntries(
    ANLASS_CATALOG.flatMap((c) => c.items.map((i) => [i.code, i.label]))
);

// Demo-Indikatoren (später aus Backend laden)
const INDICATORS: { id: string; label: string }[] = [
    { id: "INJURY_UNEXPLAINED", label: "Unerklärte Verletzungen" },
    { id: "FEAR_OF_CAREGIVER", label: "Angst vor Bezugsperson" },
    { id: "NEGLECT_HYGIENE", label: "Vernachlässigung/Hygiene" },
    { id: "ABSENCE_PATTERN", label: "Auffälliges Fehlzeitenmuster" },
    { id: "DISCLOSURE", label: "Offenbarung/Aussage Kind" },
];

/**
 * Backend-Enums (falloeffnungen/meldung/model):
 * - Meldeweg: TELEFON, EMAIL, PERSOENLICH, BRIEF, SONSTIGES
 * - Dringlichkeit: AKUT_HEUTE, ZEITNAH_24_48H, BEOBACHTEN, UNKLAR
 * - Datenbasis: BEOBACHTUNG, ERZAEHLUNG, DOKUMENT, UNKLAR
 * - AmpelStatus: GRUEN, GELB, ROT
 * - JugendamtInformiert: JA, NEIN, UNKLAR
 * - JugendamtKontaktart: TELEFON, EMAIL, SCHRIFTLICH, PERSOENLICH
 * - ObservationQuelle: EIGENE_WAHRNEHMUNG, KIND, DRITTE, UNBEKANNT
 * - ObservationOrt: ZUHAUSE, SCHULE_KITA, OEFFENTLICH, SONSTIGES
 * - ObservationZeitraum: EINMALIG, WIEDERHOLT, UNBEKANNT
 * - Sichtbarkeit: INTERN, EXTERN
 */

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
    ZEITNAH_24_48H: "Zeitnah 24-48h",
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

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
    return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function toDraftFromResponse(v: MeldungResponse): MeldungDraftRequest {
    return {
        erfasstVonRolle: v.erfasstVonRolle ?? "",
        meldeweg: v.meldeweg,
        meldewegSonstiges: v.meldewegSonstiges ?? null,
        meldendeStelleKontakt: v.meldendeStelleKontakt ?? null,
        dringlichkeit: v.dringlichkeit,
        datenbasis: v.datenbasis,
        // Einwilligung obsolet: wird hier nicht mehr als UI gerendert, Feld kann aber im Draft weiter existieren
        einwilligungVorhanden: v.einwilligungVorhanden ?? null,
        schweigepflichtentbindungVorhanden: v.schweigepflichtentbindungVorhanden ?? null,

        kurzbeschreibung: v.kurzbeschreibung ?? "",

        fachAmpel: v.fachAmpel ?? null,
        fachText: v.fachText ?? null,
        abweichungZurAuto: v.abweichungZurAuto ?? null,
        abweichungsBegruendung: v.abweichungsBegruendung ?? null,

        akutGefahrImVerzug: v.akutGefahrImVerzug ?? false,
        akutBegruendung: v.akutBegruendung ?? null,
        akutNotrufErforderlich: v.akutNotrufErforderlich ?? null,
        akutKindSicherUntergebracht: v.akutKindSicherUntergebracht ?? null,

        verantwortlicheFachkraftUserId: v.verantwortlicheFachkraftUserId ?? null,
        naechsteUeberpruefungAm: v.naechsteUeberpruefungAm ?? null,
        zusammenfassung: v.zusammenfassung ?? null,

        anlassCodes: v.anlassCodes ?? [],

        observations: (v.observations || []).map((o) => ({
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
            tags: (o.tags || []).map((t) => ({
                anlassCode: t.anlassCode ?? null,
                indicatorId: t.indicatorId ?? null,
                severity: t.severity ?? null,
                comment: t.comment ?? null,
            })),
        })),

        jugendamt: v.jugendamt
            ? {
                informiert: v.jugendamt.informiert,
                kontaktAm: v.jugendamt.kontaktAm ?? null,
                kontaktart: v.jugendamt.kontaktart ?? null,
                aktenzeichen: v.jugendamt.aktenzeichen ?? null,
                begruendung: v.jugendamt.begruendung ?? null,
            }
            : null,
    };
}

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

    // --- UI-only Upload "Info": Schweigepflichtentbindung ---
    const waiverFileRef = React.useRef<HTMLInputElement | null>(null);
    const [waiverFiles, setWaiverFiles] = React.useState<File[]>([]);

    const openFileDialog = (ref: React.RefObject<HTMLInputElement | null>) => {
        if (!ref.current) return;
        ref.current.value = ""; // erlaubt erneut dieselbe Datei zu wählen
        ref.current.click();
    };

    const onPickFilesAppend =
        (setter: React.Dispatch<React.SetStateAction<File[]>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const incoming = Array.from(e.target.files ?? []);
            if (incoming.length === 0) return;
            setter((prev) => [...prev, ...incoming]);
        };
    // -------------------------------------------------------

    React.useEffect(() => {
        setForm(toDraftFromResponse(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.id]);

    const set = <K extends keyof MeldungDraftRequest>(k: K, v: MeldungDraftRequest[K]) => setForm((s) => ({ ...s, [k]: v }));

    const toggleAnlass = (code: string) => {
        const cur = new Set(form.anlassCodes || []);
        if (cur.has(code)) cur.delete(code);
        else cur.add(code);
        set("anlassCodes", Array.from(cur));
    };

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
        set("observations", [...(form.observations || []), obs]);
    };

    const updateObs = (idx: number, patch: any) => {
        const arr = [...(form.observations || [])];
        arr[idx] = { ...arr[idx], ...patch };
        set("observations", arr);
    };

    const removeObs = (idx: number) => {
        const arr = [...(form.observations || [])];
        arr.splice(idx, 1);
        set("observations", arr);
    };

    const addObsTag = (idx: number) => {
        const arr = [...(form.observations || [])];
        const tags = [...(arr[idx].tags || [])];
        tags.push({
            anlassCode: (form.anlassCodes || [])[0] ?? null,
            indicatorId: null,
            severity: 0,
            comment: null,
        });
        arr[idx] = { ...arr[idx], tags };
        set("observations", arr);
    };

    const updateObsTag = (obsIdx: number, tagIdx: number, patch: any) => {
        const arr = [...(form.observations || [])];
        const tags = [...(arr[obsIdx].tags || [])];
        tags[tagIdx] = { ...tags[tagIdx], ...patch };
        arr[obsIdx] = { ...arr[obsIdx], tags };
        set("observations", arr);
    };

    const removeObsTag = (obsIdx: number, tagIdx: number) => {
        const arr = [...(form.observations || [])];
        const tags = [...(arr[obsIdx].tags || [])];
        tags.splice(tagIdx, 1);
        arr[obsIdx] = { ...arr[obsIdx], tags };
        set("observations", arr);
    };

    const validateForSubmitUI = (): string | null => {
        if (!form.kurzbeschreibung || String(form.kurzbeschreibung).trim().length === 0) return "Kurzbeschreibung fehlt.";
        if (!form.fachAmpel) return "Fachliche Ampel fehlt.";
        if (!form.fachText || String(form.fachText).trim().length === 0) return "Fachliche Einschätzung (Text) fehlt.";
        if (!form.jugendamt?.informiert) return "Jugendamt-Entscheidung fehlt.";
        if (form.jugendamt.informiert !== "JA" && (!form.jugendamt.begruendung || String(form.jugendamt.begruendung).trim().length === 0)) {
            return "Begründung beim Jugendamt ist erforderlich, wenn nicht informiert.";
        }
        const obs = form.observations || [];
        if (obs.length === 0) return "Mindestens eine Observation ist erforderlich.";
        if (obs.some((o) => !o.text || String(o.text).trim().length === 0)) return "Es gibt Observations ohne Text.";
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

    const statusIsDone = String(value.status || "").toUpperCase().includes("ABGESCHLOSSEN");

    return (
        <div className="space-y-4">
            {statusIsDone && (
                <Alert>
                    <AlertTitle>Abgeschlossen</AlertTitle>
                    <AlertDescription>Diese Version ist abgeschlossen und nicht mehr editierbar.</AlertDescription>
                </Alert>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">v{value.versionNo}</Badge>
                {value.current ? <Badge tone="info">current</Badge> : null}
                <Badge tone={statusIsDone ? "success" : "info"}>{value.status}</Badge>
            </div>

            <Tabs defaultValue="basis">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basis">Basis</TabsTrigger>
                    <TabsTrigger value="anlass">Anlässe</TabsTrigger>
                    <TabsTrigger value="obs">Observations</TabsTrigger>
                    <TabsTrigger value="bewertung">Bewertung</TabsTrigger>
                </TabsList>

                {/* BASIS */}
                <TabsContent value="basis" className="mt-4 space-y-4">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Erfasst von:</Label>
                            <Input
                                value={form.erfasstVonRolle ?? ""}
                                onChange={(e) => set("erfasstVonRolle", e.target.value)}
                                disabled={disabled || statusIsDone}
                                placeholder="z. B. Lehrkraft, Schulsozialarbeit…"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Meldeweg</Label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={(form.meldeweg ?? "TELEFON") as string}
                                onChange={(e) => set("meldeweg", pick(e.target.value, MELDEWEG, "TELEFON"))}
                                disabled={disabled || statusIsDone}
                            >
                                {MELDEWEG.map((m) => (
                                    <option key={m} value={m}>
                                        {MELDEWEG_LABEL[m]}
                                    </option>
                                ))}
                            </select>
                            {form.meldeweg === "SONSTIGES" ? (
                                <Input
                                    value={form.meldewegSonstiges ?? ""}
                                    onChange={(e) => set("meldewegSonstiges", e.target.value)}
                                    disabled={disabled || statusIsDone}
                                    placeholder="Bitte spezifizieren…"
                                />
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label>Dringlichkeit</Label>
                            <select
                                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={(form.dringlichkeit ?? "UNKLAR") as string}
                                onChange={(e) => set("dringlichkeit", pick(e.target.value, DRING, "UNKLAR"))}
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
                                value={(form.datenbasis ?? "UNKLAR") as string}
                                onChange={(e) => set("datenbasis", pick(e.target.value, DATENB, "UNKLAR"))}
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
                                value={form.meldendeStelleKontakt ?? ""}
                                onChange={(e) => set("meldendeStelleKontakt", e.target.value)}
                                disabled={disabled || statusIsDone}
                                placeholder="Name / Telefon / Institution…"
                            />
                        </div>

                        {/* SCHWEIGEPFLICHTENTBINDUNG: Upload-Info + Switch */}
                        <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-3">
                            <div className="flex-1 space-y-2">
                                <div className="font-medium">Schweigepflichtentbindung</div>

                                <input
                                    ref={waiverFileRef}
                                    type="file"
                                    className="hidden"
                                    multiple
                                    onChange={onPickFilesAppend(setWaiverFiles)}
                                    disabled={disabled || statusIsDone}
                                />

                                <UploadInfoList
                                    title="Angehängte Unterlagen (UI)"
                                    files={waiverFiles}
                                    onUploadClick={() => openFileDialog(waiverFileRef)}
                                    onRemoveAt={(idx) => setWaiverFiles((prev) => prev.filter((_, i) => i !== idx))}
                                    disabled={disabled || statusIsDone}
                                />
                            </div>

                            <div className="pt-1">
                                <Switch
                                    checked={!!form.schweigepflichtentbindungVorhanden}
                                    onCheckedChange={(v) => set("schweigepflichtentbindungVorhanden", v)}
                                    disabled={disabled || statusIsDone}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Kurzbeschreibung (Pflicht)</Label>
                        <Textarea
                            value={String(form.kurzbeschreibung ?? "")}
                            onChange={(e) => set("kurzbeschreibung", e.target.value)}
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
                        <AlertDescription>Auswahl wird als Codes gespeichert.</AlertDescription>
                    </Alert>

                    <div className="space-y-5">
                        {ANLASS_CATALOG.map((cat) => (
                            <div key={cat.key} className="space-y-2">
                                <div className="text-sm font-semibold">{cat.title}</div>
                                <div className="flex flex-wrap gap-2">
                                    {cat.items.map(({ code, label }) => {
                                        const active = (form.anlassCodes || []).includes(code);
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
                        Ausgewählt: <Badge variant="secondary">{(form.anlassCodes || []).length}</Badge>
                    </div>
                </TabsContent>

                {/* OBSERVATIONS */}
                <TabsContent value="obs" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Observations</div>
                            <div className="text-sm text-muted-foreground">
                                Jede Observation kann mehrere Tags (Anlass/Indikator/Severity) haben.
                            </div>
                        </div>
                        <Button onClick={addObservation} disabled={disabled || statusIsDone}>
                            + Observation
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {(form.observations || []).map((o: any, idx: number) => (
                            <Card key={idx} className="rounded-2xl">
                                <CardHeader className="flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle className="text-base">Observation #{idx + 1}</CardTitle>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {o.zeitpunkt ? new Date(o.zeitpunkt).toLocaleString() : "—"}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" onClick={() => addObsTag(idx)} disabled={disabled || statusIsDone}>
                                            + Tag
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => removeObs(idx)} disabled={disabled || statusIsDone}>
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
                                                onChange={(e) =>
                                                    updateObs(idx, { zeitraum: pick(e.target.value, OBS_ZEITRAUM, "UNBEKANNT") })
                                                }
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
                                                    onChange={(e) => updateObs(idx, { ortSonstiges: e.target.value })}
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
                                                onChange={(e) =>
                                                    updateObs(idx, { quelle: pick(e.target.value, OBS_QUELLE, "UNBEKANNT") })
                                                }
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
                                                onChange={(e) => updateObs(idx, { woertlichesZitat: e.target.value })}
                                                disabled={disabled || statusIsDone}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Körperbefund (optional)</Label>
                                            <Textarea
                                                value={o.koerperbefund ?? ""}
                                                onChange={(e) => updateObs(idx, { koerperbefund: e.target.value })}
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
                                                onChange={(e) => updateObs(idx, { verhaltenKind: e.target.value })}
                                                disabled={disabled || statusIsDone}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Verhalten Bezugsperson</Label>
                                            <Textarea
                                                value={o.verhaltenBezug ?? ""}
                                                onChange={(e) => updateObs(idx, { verhaltenBezug: e.target.value })}
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
                                                                    {(form.anlassCodes || ANLASS_CODES).map((c) => (
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
                                                                    onChange={(e) =>
                                                                        updateObsTag(idx, tIdx, { severity: clampSeverity(Number(e.target.value)) })
                                                                    }
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
                                                                    onChange={(e) => updateObsTag(idx, tIdx, { comment: e.target.value })}
                                                                    disabled={disabled || statusIsDone}
                                                                />
                                                            </div>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => removeObsTag(idx, tIdx)}
                                                                disabled={disabled || statusIsDone}
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

                {/* BEWERTUNG / SUBMIT */}
                <TabsContent value="bewertung" className="mt-4 space-y-4">
                    {validationErr ? (
                        <Alert>
                            <AlertTitle>Unvollständig</AlertTitle>
                            <AlertDescription>{validationErr}</AlertDescription>
                        </Alert>
                    ) : null}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Fachliche Einschätzung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label>Fach-Ampel</Label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.fachAmpel ?? ""}
                                    onChange={(e) => set("fachAmpel", e.target.value ? pick(e.target.value, AMPEL, "GRUEN") : null)}
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
                                <Label>Begründung (Pflicht bei Submit)</Label>
                                <Textarea
                                    rows={5}
                                    value={form.fachText ?? ""}
                                    onChange={(e) => set("fachText", e.target.value)}
                                    disabled={disabled || statusIsDone}
                                    placeholder="Warum diese Ampel? Welche Indikatoren/Beobachtungen sind maßgeblich?"
                                />
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                                    <div>
                                        <div className="font-medium">Gefahr im Verzug</div>
                                        <div className="text-xs text-muted-foreground">Akutcheck</div>
                                    </div>
                                    <Switch
                                        checked={!!form.akutGefahrImVerzug}
                                        onCheckedChange={(v) => set("akutGefahrImVerzug", v)}
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>

                                <div className="flex items-center justify-between rounded-xl border border-border p-3">
                                    <div>
                                        <div className="font-medium">Notruf erforderlich</div>
                                        <div className="text-xs text-muted-foreground">Optional</div>
                                    </div>
                                    <Switch
                                        checked={!!form.akutNotrufErforderlich}
                                        onCheckedChange={(v) => set("akutNotrufErforderlich", v)}
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>
                            </div>

                            {!!form.akutGefahrImVerzug ? (
                                <div className="space-y-1">
                                    <Label>Akut-Begründung</Label>
                                    <Textarea
                                        rows={3}
                                        value={form.akutBegruendung ?? ""}
                                        onChange={(e) => set("akutBegruendung", e.target.value)}
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Jugendamt</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-1">
                                <Label>Informiert?</Label>
                                <select
                                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    value={form.jugendamt?.informiert ?? ""}
                                    onChange={(e) =>
                                        set("jugendamt", {
                                            ...(form.jugendamt || { informiert: "UNKLAR" }),
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
                                        value={form.jugendamt?.kontaktart ?? ""}
                                        onChange={(e) =>
                                            set("jugendamt", {
                                                ...(form.jugendamt || { informiert: "UNKLAR" }),
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
                                    <Label>Kontakt am (ISO, optional)</Label>
                                    <Input
                                        value={form.jugendamt?.kontaktAm ?? ""}
                                        onChange={(e) =>
                                            set("jugendamt", {
                                                ...(form.jugendamt || { informiert: "UNKLAR" }),
                                                kontaktAm: e.target.value || null,
                                            })
                                        }
                                        disabled={disabled || statusIsDone}
                                        placeholder="2026-02-27T10:30:00Z"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Aktenzeichen (optional)</Label>
                                <Input
                                    value={form.jugendamt?.aktenzeichen ?? ""}
                                    onChange={(e) =>
                                        set("jugendamt", {
                                            ...(form.jugendamt || { informiert: "UNKLAR" }),
                                            aktenzeichen: e.target.value || null,
                                        })
                                    }
                                    disabled={disabled || statusIsDone}
                                />
                            </div>

                            {form.jugendamt?.informiert && form.jugendamt.informiert !== "JA" ? (
                                <div className="space-y-1">
                                    <Label>Begründung (Pflicht wenn nicht JA)</Label>
                                    <Textarea
                                        rows={3}
                                        value={form.jugendamt?.begruendung ?? ""}
                                        onChange={(e) =>
                                            set("jugendamt", {
                                                ...(form.jugendamt || { informiert: "UNKLAR" }),
                                                begruendung: e.target.value || null,
                                            })
                                        }
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    <Label>Begründung (optional)</Label>
                                    <Textarea
                                        rows={3}
                                        value={form.jugendamt?.begruendung ?? ""}
                                        onChange={(e) =>
                                            set("jugendamt", {
                                                ...(form.jugendamt || { informiert: "UNKLAR" }),
                                                begruendung: e.target.value || null,
                                            })
                                        }
                                        disabled={disabled || statusIsDone}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Speichern / Abschließen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <Button onClick={doSave} disabled={disabled || statusIsDone || saving}>
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

                                <Button onClick={doSubmit} disabled={disabled || statusIsDone || saving}>
                                    Abschließen (Submit)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}