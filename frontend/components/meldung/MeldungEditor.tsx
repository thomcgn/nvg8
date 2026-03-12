"use client";

import * as React from "react";
import type { MeldungDraftRequest, MeldungResponse } from "@/lib/api/meldung";
import { ANLASS_CATALOG, ANLASS_CODES, ANLASS_DEFAULT_SEVERITY, anlassLabel } from "@/lib/anlass/catalog";

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

import {
    FileText,
    ShieldAlert,
    ClipboardCheck,
    Save,
    CheckCircle2,
    AlertTriangle,
    Phone,
    Building2,
} from "lucide-react";

/* ---------------- Helpers ---------------- */

function clampSeverity(n: number): number {
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(3, Math.round(n)));
}

function pick<T extends string>(value: string, allowed: readonly T[], fallback: T): T {
    return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function nowIso() {
    return new Date().toISOString();
}

function normalizeCompareValue(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return JSON.stringify(value);
}

function getByPath(obj: any, path: string): unknown {
    return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

function isSameValue(a: unknown, b: unknown): boolean {
    return normalizeCompareValue(a) === normalizeCompareValue(b);
}

function renderPreviousValue(v: unknown) {
    const s = normalizeCompareValue(v);
    return s ? s : "—";
}

function changedInputClass(changed: boolean) {
    return changed ? "border-red-300 bg-red-50/40 focus-visible:ring-red-300" : "";
}

function changedLabelClass(changed: boolean) {
    return changed ? "text-red-700" : "text-brand-text";
}

function changeTooltip(changed: boolean, previousValue: unknown) {
    if (!changed) return undefined;
    return `Vorherige Version: ${renderPreviousValue(previousValue)}`;
}

/* ---------------- Backend Enums ---------------- */

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

const ABW_AUTO = ["GLEICH", "NIEDRIGER", "HOEHER"] as const;
const ABW_AUTO_LABEL: Record<(typeof ABW_AUTO)[number], string> = {
    GLEICH: "Keine Abweichung (entspricht Vorbewertung)",
    NIEDRIGER: "Abweichung: niedriger als Vorbewertung",
    HOEHER: "Abweichung: höher als Vorbewertung",
};

const JANEINUNKLAR = ["JA", "NEIN", "UNKLAR"] as const;
const JNU_LABEL: Record<(typeof JANEINUNKLAR)[number], string> = {
    JA: "Ja",
    NEIN: "Nein",
    UNKLAR: "Unklar",
};

const KONTAKT_MIT = [
    "KIND",
    "MUTTER",
    "VATER",
    "BEZUGSPERSON",
    "JUGENDAMT",
    "ARZT",
    "SONSTIGE",
] as const;
const KONTAKT_MIT_LABEL: Record<(typeof KONTAKT_MIT)[number], string> = {
    KIND: "Kind",
    MUTTER: "Mutter",
    VATER: "Vater",
    BEZUGSPERSON: "Bezugsperson",
    JUGENDAMT: "Jugendamt",
    ARZT: "Arzt / Ärztin",
    SONSTIGE: "Sonstige",
};

const KONTAKT_STATUS = ["GEPLANT", "ERREICHT", "NICHT_ERREICHT", "ABGEBROCHEN"] as const;
const KONTAKT_STATUS_LABEL: Record<(typeof KONTAKT_STATUS)[number], string> = {
    GEPLANT: "Geplant",
    ERREICHT: "Erreicht",
    NICHT_ERREICHT: "Nicht erreicht",
    ABGEBROCHEN: "Abgebrochen",
};

const KONTAKTART = ["TELEFON", "EMAIL", "PERSOENLICH", "SCHRIFTLICH", "SONSTIGES"] as const;
const KONTAKTART_LABEL: Record<(typeof KONTAKTART)[number], string> = {
    TELEFON: "Telefon",
    EMAIL: "E-Mail",
    PERSOENLICH: "Persönlich",
    SCHRIFTLICH: "Schriftlich",
    SONSTIGES: "Sonstiges",
};

function isDoneStatus(status: string | null | undefined) {
    const s = String(status ?? "").toUpperCase();
    return s.includes("ABGESCH") || s.includes("GESCHLOSS") || s.includes("SUBMIT");
}

/* ---------------- Auto-Ampel ---------------- */

function ampToRank(a: string | null | undefined): number {
    if (a === "GRUEN") return 0;
    if (a === "GELB") return 1;
    if (a === "ROT") return 2;
    return -1;
}

function computeAutoAssessment(form: MeldungDraftRequest) {
    const obs = ((form as any).observations || []) as any[];

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

    const akutBonus = (form.akutGefahrImVerzug ? 1.25 : 0) + (form.akutNotrufErforderlich ? 0.75 : 0);
    const score = maxSeverity * 2.0 + avgSeverity * 1.0 + Math.min(2, repeatedCount) * 0.5 + akutBonus;

    let autoAmpel: (typeof AMPEL)[number] = "GRUEN";
    if (score >= 4.5) autoAmpel = "ROT";
    else if (score >= 2.0) autoAmpel = "GELB";

    const rationaleParts: string[] = [];
    if (tagCount === 0) rationaleParts.push("Keine Tags/Severity");
    else {
        rationaleParts.push(`Max ${maxSeverity}`);
        rationaleParts.push(`Ø ${avgSeverity.toFixed(1)}`);
        if (repeatedCount) rationaleParts.push(`${repeatedCount}× wiederholt`);
    }
    if (form.akutGefahrImVerzug) rationaleParts.push("Gefahr im Verzug");
    if (form.akutNotrufErforderlich) rationaleParts.push("Notruf");

    return {
        score: Number.isFinite(score) ? Math.round(score * 10) / 10 : 0,
        autoAmpel,
        rationale: rationaleParts.join(" · "),
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
        changeReason: (v as any).changeReason ?? null,
        infoEffectiveAt: (v as any).infoEffectiveAt ?? null,
        reasonText: (v as any).reasonText ?? null,

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

/* ---------------- Auto-Tag Generation ---------------- */

function normalizeAnlassCodes(input: any): string[] {
    const arr = Array.isArray(input) ? input : [];
    const codes = arr.filter((x) => typeof x === "string" && ANLASS_CODES.includes(x));
    return Array.from(new Set(codes));
}

function syncObsTagsToAnlassCodes(observation: any, anlassCodes: string[]) {
    const existing = Array.isArray(observation?.tags) ? observation.tags : [];
    const byCode = new Map<string, any>();

    for (const t of existing) {
        const c = t?.anlassCode;
        if (typeof c === "string" && c) {
            if (!byCode.has(c)) byCode.set(c, t);
        }
    }

    const nextTags = anlassCodes.map((code) => {
        const prev = byCode.get(code);
        if (prev) {
            return {
                ...prev,
                anlassCode: code,
                severity: prev.severity ?? ANLASS_DEFAULT_SEVERITY[code] ?? 0,
            };
        }
        return {
            anlassCode: code,
            indicatorId: null,
            severity: ANLASS_DEFAULT_SEVERITY[code] ?? 0,
            comment: null,
        };
    });

    return { ...observation, tags: nextTags };
}

function syncAllObservations(form: MeldungDraftRequest) {
    const anlassCodes = normalizeAnlassCodes((form as any).anlassCodes);
    const obs = Array.isArray((form as any).observations) ? (form as any).observations : [];
    const nextObs = obs.map((o: any) => syncObsTagsToAnlassCodes(o, anlassCodes));
    return { ...form, anlassCodes, observations: nextObs } as any;
}

/* ---------------- UI bits ---------------- */

function PageCard(props: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
    return (
        <Card className="border border-brand-border/40 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-brand-text flex items-center gap-2">
                    {props.icon}
                    {props.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">{props.children}</CardContent>
        </Card>
    );
}

function FieldRow(props: {
    label: string;
    children: React.ReactNode;
    hint?: string;
    labelClassName?: string;
    changed?: boolean;
    previousValue?: unknown;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <Label className={props.labelClassName ?? "text-brand-text"}>{props.label}</Label>
                {props.changed ? <Badge tone="danger">geändert</Badge> : null}
            </div>

            {props.children}

            {props.changed ? (
                <div className="text-xs text-red-700">Vorher: {renderPreviousValue(props.previousValue)}</div>
            ) : null}

            {props.hint ? (
                <div className={props.changed ? "text-xs text-red-700/80" : "text-xs text-brand-text2"}>{props.hint}</div>
            ) : null}
        </div>
    );
}

/* ---------------- Component ---------------- */

export function MeldungEditor(props: {
    value: MeldungResponse;
    disabled?: boolean;
    onSaveDraft: (req: MeldungDraftRequest) => Promise<MeldungResponse | void>;
    onSubmit: (mirrorToNotizen: boolean, changeReason?: string) => Promise<void>;
}) {
    const { value, disabled = false, onSaveDraft, onSubmit } = props;

    const statusIsDone = isDoneStatus((value as any)?.status);

    const isCorrection = React.useMemo(() => {
        const t = String((value as any)?.type ?? "").toUpperCase();
        const correctsId = (value as any)?.correctsId;
        return t === "KORREKTUR" || (typeof correctsId === "number" && correctsId > 0);
    }, [value]);

    const TAB_ITEMS = React.useMemo(
        () =>
            [
                ["basis", "Basis"],
                ["anlass", "Anlässe"],
                ["obs", "Beobachtungen"],
                ["fach", "Fachbewertung"],
                ["akut", "Akut / Schutz"],
                ["kontakte", "Kontakte"],
                ["planung", "Planung"],
                ["save", "Speichern"],
            ] as const,
        []
    );

    const [activeTab, setActiveTab] = React.useState<(typeof TAB_ITEMS)[number][0]>("basis");

    const [form, setForm] = React.useState<MeldungDraftRequest>(() => syncAllObservations(toDraftFromResponse(value)));
    const initialDraftRef = React.useRef<MeldungDraftRequest>(syncAllObservations(toDraftFromResponse(value)));

    const [saving, setSaving] = React.useState(false);
    const [saveMsg, setSaveMsg] = React.useState<string | null>(null);

    const [submitMirror, setSubmitMirror] = React.useState(true);
    const [validationErr, setValidationErr] = React.useState<string | null>(null);

    const [changeReason, setChangeReason] = React.useState(String((value as any)?.reasonText ?? (value as any)?.changeReason ?? ""));
    const [submitErr, setSubmitErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        const nextDraft = syncAllObservations(toDraftFromResponse(value));
        initialDraftRef.current = nextDraft;
        setForm(nextDraft);
        setSaveMsg(null);
        setValidationErr(null);
        setSubmitErr(null);
        setChangeReason(String((value as any)?.reasonText ?? (value as any)?.changeReason ?? ""));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [(value as any).id]);

    const set = <K extends keyof MeldungDraftRequest>(k: K, v: MeldungDraftRequest[K]) =>
        setForm((s) => syncAllObservations({ ...(s as any), [k]: v } as any));

    const isChanged = React.useCallback(
        (path: string) => {
            if (!isCorrection) return false;
            const before = getByPath(initialDraftRef.current as any, path);
            const after = getByPath(form as any, path);
            return !isSameValue(before, after);
        },
        [form, isCorrection]
    );

    const previousValueOf = React.useCallback((path: string) => getByPath(initialDraftRef.current as any, path), []);

    /* ------------ Anlass selection + Tag generation ------------ */

    const toggleAnlass = (code: string) => {
        setForm((prev) => {
            const cur = new Set(normalizeAnlassCodes((prev as any).anlassCodes));
            if (cur.has(code)) cur.delete(code);
            else cur.add(code);
            const next = { ...(prev as any), anlassCodes: Array.from(cur) } as any;
            return syncAllObservations(next);
        });
    };

    /* ---------------- Observations helpers ---------------- */

    const addObservation = () => {
        setForm((prev) => {
            const obs = Array.isArray((prev as any).observations) ? [...(prev as any).observations] : [];
            const newObs = {
                zeitpunkt: nowIso(),
                zeitraum: "EINMALIG",
                ort: "SCHULE_KITA",
                ortSonstiges: null,
                quelle: "EIGENE_WAHRNEHMUNG",
                sichtbarkeit: "INTERN",
                text: "",
                woertlichesZitat: null,
                koerperbefund: null,
                verhaltenKind: null,
                verhaltenBezug: null,
                tags: [],
            };
            obs.push(newObs);
            const next = { ...(prev as any), observations: obs } as any;
            return syncAllObservations(next);
        });
    };

    const updateObs = (idx: number, patch: any) => {
        setForm((prev) => {
            const obs = Array.isArray((prev as any).observations) ? [...(prev as any).observations] : [];
            obs[idx] = { ...(obs[idx] ?? {}), ...patch };
            const next = { ...(prev as any), observations: obs } as any;
            return syncAllObservations(next);
        });
    };

    const removeObs = (idx: number) => {
        setForm((prev) => {
            const obs = Array.isArray((prev as any).observations) ? [...(prev as any).observations] : [];
            obs.splice(idx, 1);
            const next = { ...(prev as any), observations: obs } as any;
            return syncAllObservations(next);
        });
    };

    const updateObsTag = (obsIdx: number, anlassCode: string, patch: any) => {
        setForm((prev) => {
            const obs = Array.isArray((prev as any).observations) ? [...(prev as any).observations] : [];
            const o = obs[obsIdx];
            if (!o) return prev;

            const tags = Array.isArray(o.tags) ? [...o.tags] : [];
            const i = tags.findIndex((t: any) => t?.anlassCode === anlassCode);
            if (i < 0) return prev;

            tags[i] = { ...tags[i], ...patch, anlassCode };
            obs[obsIdx] = { ...o, tags };

            const next = { ...(prev as any), observations: obs } as any;
            return syncAllObservations(next);
        });
    };

    /* ---------------- Contacts helpers ---------------- */

    const addContact = () => {
        setForm((prev) => {
            const list = Array.isArray((prev as any).contacts) ? [...(prev as any).contacts] : [];
            list.push({
                kontaktMit: "SONSTIGE",
                kontaktAm: nowIso(),
                status: "GEPLANT",
                notiz: null,
                ergebnis: null,
            });
            return { ...(prev as any), contacts: list } as any;
        });
    };

    const updateContact = (idx: number, patch: any) => {
        setForm((prev) => {
            const list = Array.isArray((prev as any).contacts) ? [...(prev as any).contacts] : [];
            list[idx] = { ...(list[idx] ?? {}), ...patch };
            return { ...(prev as any), contacts: list } as any;
        });
    };

    const removeContact = (idx: number) => {
        setForm((prev) => {
            const list = Array.isArray((prev as any).contacts) ? [...(prev as any).contacts] : [];
            list.splice(idx, 1);
            return { ...(prev as any), contacts: list } as any;
        });
    };

    /* ---------------- Jugendamt helpers ---------------- */

    const ensureJugendamt = () => {
        setForm((prev) => {
            if ((prev as any).jugendamt) return prev;
            return {
                ...(prev as any),
                jugendamt: {
                    informiert: null,
                    kontaktAm: null,
                    kontaktart: null,
                    aktenzeichen: null,
                    begruendung: null,
                },
            } as any;
        });
    };

    const clearJugendamt = () => {
        setForm((prev) => ({ ...(prev as any), jugendamt: null } as any));
    };

    const setJugendamt = (patch: any) => {
        setForm((prev) => ({
            ...(prev as any),
            jugendamt: {
                informiert: null,
                kontaktAm: null,
                kontaktart: null,
                aktenzeichen: null,
                begruendung: null,
                ...((prev as any).jugendamt ?? {}),
                ...patch,
            },
        }) as any);
    };

    /* ---------------- Validation ---------------- */

    function validateForSaveUI(): string | null {
        const kb = String((form as any).kurzbeschreibung ?? "").trim();
        if (!kb) return "Kurzbeschreibung (Sachlage) ist erforderlich.";
        return null;
    }

    function validateForSubmitUI(): string | null {
        const base = validateForSaveUI();
        if (base) return base;

        const anlassCodes = normalizeAnlassCodes((form as any).anlassCodes);
        if (anlassCodes.length === 0) return "Bitte mindestens einen Anlass auswählen.";

        const obs = Array.isArray((form as any).observations) ? (form as any).observations : [];
        if (obs.length === 0) return "Bitte mindestens eine Beobachtung erfassen.";

        if (isCorrection) {
            const r = String(changeReason ?? "").trim();
            if (!r) return "Änderungsgrund ist erforderlich (Pflicht bei Korrektur).";
        }

        return null;
    }

    /* ---------------- Save / Submit ---------------- */

    const doSave = async () => {
        setSaveMsg(null);
        setSubmitErr(null);

        const vErr = validateForSaveUI();
        setValidationErr(vErr);
        if (vErr) return;

        setSaving(true);
        try {
            const normalized = syncAllObservations(form);
            await onSaveDraft(normalized);
            setSaveMsg("Entwurf gespeichert.");
        } catch (e: any) {
            setSaveMsg(null);
            setSubmitErr(e?.message || "Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    };

    const doSubmit = async () => {
        setSaveMsg(null);
        setSubmitErr(null);

        const vErr = validateForSubmitUI();
        setValidationErr(vErr);
        if (vErr) return;

        setSaving(true);
        try {
            const normalized = syncAllObservations(form);
            await onSaveDraft(normalized);

            const trimmed = String(changeReason ?? "").trim();
            await onSubmit(submitMirror, isCorrection ? trimmed : undefined);

            setSaveMsg("Meldung abgeschlossen.");
        } catch (e: any) {
            setSaveMsg(null);
            setSubmitErr(e?.message || "Abschließen fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    };

    /* ---------------- Derived ---------------- */

    const auto = React.useMemo(() => computeAutoAssessment(form), [form]);

    const fachAmpel = (form as any).fachAmpel ?? null;
    const computedAbw = computeAbweichungZurAuto(fachAmpel, auto.autoAmpel);

    React.useEffect(() => {
        setForm((prev) => {
            const cur = (prev as any).abweichungZurAuto;
            if (cur) return prev;
            return { ...(prev as any), abweichungZurAuto: computedAbw } as any;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [computedAbw]);

    const headerTitle = React.useMemo(() => {
        const t = String((value as any)?.type ?? "Meldung");
        const vNo = (value as any)?.versionNo;
        return `${t}${typeof vNo === "number" ? ` · v${vNo}` : ""}`;
    }, [value]);

    const submitDisabled =
        disabled || statusIsDone || saving || (isCorrection && !String(changeReason ?? "").trim());

    const selectedAnlassLabels = normalizeAnlassCodes((form as any).anlassCodes).map(anlassLabel);

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-brand-border/40 bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="text-base font-semibold text-brand-text flex items-center gap-2">
                            <FileText className="h-5 w-5 text-brand-text2" />
                            <span className="truncate">{headerTitle}</span>
                            {isCorrection ? <Badge tone="warning">Korrektur</Badge> : null}
                            {statusIsDone ? <Badge tone="success">abgeschlossen</Badge> : <Badge tone="info">Entwurf</Badge>}
                        </div>

                        <div className="mt-1 text-sm text-brand-text2">
                            §8a-konforme Dokumentation: sachlich, nachvollziehbar, mit Verlauf.
                        </div>

                        {isCorrection ? (
                            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    Dies ist eine <span className="font-semibold">Korrektur</span>. Geänderte Felder sind rot markiert.
                                    Per <span className="font-semibold">Hover</span> siehst du den Wert der vorherigen Version.
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                            variant="secondary"
                            className="h-11 gap-2 w-full sm:w-auto"
                            onClick={doSave}
                            disabled={disabled || statusIsDone || saving}
                        >
                            <Save className="h-4 w-4" />
                            Entwurf speichern
                        </Button>

                        <Button className="h-11 gap-2 w-full sm:w-auto" onClick={doSubmit} disabled={submitDisabled}>
                            <CheckCircle2 className="h-4 w-4" />
                            Abschließen
                        </Button>
                    </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                        <div className="text-xs font-semibold text-brand-text2">Auto-Ampel</div>
                        <div className="mt-1 text-sm font-semibold text-brand-text">
                            {AMPEL_LABEL[pick(auto.autoAmpel, AMPEL, "GRUEN")]}
                        </div>
                        <div className="mt-1 text-xs text-brand-text2">{auto.rationale}</div>
                    </div>

                    <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                        <div className="text-xs font-semibold text-brand-text2">Fach-Ampel</div>
                        <div className="mt-1 text-sm font-semibold text-brand-text">
                            {fachAmpel ? AMPEL_LABEL[pick(fachAmpel, AMPEL, "GRUEN")] : "—"}
                        </div>
                        <div className="mt-1 text-xs text-brand-text2">
                            Abweichung: {ABW_AUTO_LABEL[pick((form as any).abweichungZurAuto ?? "GLEICH", ABW_AUTO, "GLEICH")]}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                        <div className="text-xs font-semibold text-brand-text2">Dringlichkeit</div>
                        <div className="mt-1 text-sm font-semibold text-brand-text">
                            {DRING_LABEL[pick((form as any).dringlichkeit ?? "UNKLAR", DRING, "UNKLAR")]}
                        </div>
                        <div className="mt-1 text-xs text-brand-text2">Bitte sachlich & überprüfbar formulieren.</div>
                    </div>
                </div>
            </div>

            {validationErr ? (
                <Alert variant="destructive">
                    <AlertTitle>Bitte prüfen</AlertTitle>
                    <AlertDescription>{validationErr}</AlertDescription>
                </Alert>
            ) : null}

            {submitErr ? (
                <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                    {submitErr}
                </div>
            ) : null}

            {saveMsg ? (
                <div className="rounded-2xl border border-brand-border/40 bg-white p-3 text-sm text-brand-text">
                    {saveMsg}
                </div>
            ) : null}

            <div className="rounded-2xl border border-brand-border/40 bg-white p-2">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <TabsList className="w-full flex flex-wrap justify-start gap-1 h-auto bg-transparent">
                        {TAB_ITEMS.map(([key, label]) => (
                            <TabsTrigger key={key} value={key} className="data-[state=active]:bg-brand-bg rounded-xl">
                                {label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="px-2 pb-2">
                        <Separator className="my-3" />

                        <TabsContent value="basis" className="m-0">
                            <PageCard title="Basis" icon={<ClipboardCheck className="h-4 w-4 text-brand-text2" />}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(() => {
                                        const changed = isChanged("erfasstVonRolle");
                                        const prev = previousValueOf("erfasstVonRolle");
                                        return (
                                            <FieldRow
                                                label="Erfasst von (Rolle)"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Input
                                                    value={String((form as any).erfasstVonRolle ?? "")}
                                                    onChange={(e) => set("erfasstVonRolle" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}

                                    {(() => {
                                        const changed = isChanged("meldeweg");
                                        const prev = previousValueOf("meldeweg");
                                        return (
                                            <FieldRow
                                                label="Meldeweg"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <select
                                                    className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(
                                                        changed
                                                    )}`}
                                                    value={pick(String((form as any).meldeweg ?? "TELEFON"), MELDEWEG, "TELEFON")}
                                                    onChange={(e) => set("meldeweg" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    title={changeTooltip(changed, prev)}
                                                >
                                                    {MELDEWEG.map((x) => (
                                                        <option key={x} value={x}>
                                                            {MELDEWEG_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>
                                        );
                                    })()}

                                    {String((form as any).meldeweg) === "SONSTIGES" ? (
                                        <FieldRow label="Meldeweg sonstiges">
                                            <Input
                                                value={String((form as any).meldewegSonstiges ?? "")}
                                                onChange={(e) => set("meldewegSonstiges" as any, e.target.value || null)}
                                                disabled={disabled || statusIsDone}
                                            />
                                        </FieldRow>
                                    ) : null}

                                    {(() => {
                                        const changed = isChanged("meldendeStelleKontakt");
                                        const prev = previousValueOf("meldendeStelleKontakt");
                                        return (
                                            <FieldRow
                                                label="Meldende Stelle (Kontakt)"
                                                hint="z.B. Name/Institution, Rückrufnummer, E-Mail"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Input
                                                    value={String((form as any).meldendeStelleKontakt ?? "")}
                                                    onChange={(e) => set("meldendeStelleKontakt" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}

                                    {(() => {
                                        const changed = isChanged("datenbasis");
                                        const prev = previousValueOf("datenbasis");
                                        return (
                                            <FieldRow
                                                label="Datenbasis"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <select
                                                    className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(
                                                        changed
                                                    )}`}
                                                    value={pick(String((form as any).datenbasis ?? "UNKLAR"), DATENB, "UNKLAR")}
                                                    onChange={(e) => set("datenbasis" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    title={changeTooltip(changed, prev)}
                                                >
                                                    {DATENB.map((x) => (
                                                        <option key={x} value={x}>
                                                            {DATENB_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>
                                        );
                                    })()}

                                    {(() => {
                                        const changed = isChanged("dringlichkeit");
                                        const prev = previousValueOf("dringlichkeit");
                                        return (
                                            <FieldRow
                                                label="Dringlichkeit"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <select
                                                    className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(
                                                        changed
                                                    )}`}
                                                    value={pick(String((form as any).dringlichkeit ?? "UNKLAR"), DRING, "UNKLAR")}
                                                    onChange={(e) => set("dringlichkeit" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    title={changeTooltip(changed, prev)}
                                                >
                                                    {DRING.map((x) => (
                                                        <option key={x} value={x}>
                                                            {DRING_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>
                                        );
                                    })()}

                                    <FieldRow label="Einwilligung vorhanden">
                                        <select
                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                            value={String((form as any).einwilligungVorhanden ?? "")}
                                            onChange={(e) => set("einwilligungVorhanden" as any, e.target.value === "" ? null : e.target.value === "true")}
                                            disabled={disabled || statusIsDone}
                                        >
                                            <option value="">—</option>
                                            <option value="true">Ja</option>
                                            <option value="false">Nein</option>
                                        </select>
                                    </FieldRow>

                                    <FieldRow label="Schweigepflichtentbindung vorhanden">
                                        <select
                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                            value={String((form as any).schweigepflichtentbindungVorhanden ?? "")}
                                            onChange={(e) =>
                                                set("schweigepflichtentbindungVorhanden" as any, e.target.value === "" ? null : e.target.value === "true")
                                            }
                                            disabled={disabled || statusIsDone}
                                        >
                                            <option value="">—</option>
                                            <option value="true">Ja</option>
                                            <option value="false">Nein</option>
                                        </select>
                                    </FieldRow>

                                    {(() => {
                                        const changed = isChanged("kurzbeschreibung");
                                        const prev = previousValueOf("kurzbeschreibung");
                                        return (
                                            <FieldRow
                                                label="Kurzbeschreibung (Sachlage)"
                                                hint="Kurz, sachlich, überprüfbar. Keine Wertungen."
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Textarea
                                                    rows={5}
                                                    value={String((form as any).kurzbeschreibung ?? "")}
                                                    onChange={(e) => set("kurzbeschreibung" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="anlass" className="m-0">
                            <PageCard title="Anlässe" icon={<FileText className="h-4 w-4 text-brand-text2" />}>
                                <div className="text-sm text-brand-text2">
                                    Auswahl steuert die automatische Tag-Erstellung in den Beobachtungen.
                                </div>

                                {selectedAnlassLabels.length ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAnlassLabels.map((label) => (
                                            <Badge key={label} tone="info">
                                                {label}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : null}

                                <div className="space-y-4">
                                    {ANLASS_CATALOG.map((cat) => (
                                        <div key={cat.key} className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                            <div className="text-sm font-semibold text-brand-text">{cat.title}</div>

                                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {cat.items.map((it) => {
                                                    const selected = normalizeAnlassCodes((form as any).anlassCodes).includes(it.code);
                                                    const allChanged = isChanged("anlassCodes");
                                                    const prev = previousValueOf("anlassCodes");
                                                    return (
                                                        <button
                                                            key={it.code}
                                                            type="button"
                                                            onClick={() => toggleAnlass(it.code)}
                                                            disabled={disabled || statusIsDone}
                                                            title={changeTooltip(allChanged, prev)}
                                                            className={[
                                                                "rounded-2xl border p-3 text-left transition",
                                                                selected
                                                                    ? "border-brand-border/60 bg-brand-bg"
                                                                    : "border-brand-border/25 bg-white hover:bg-brand-bg/40",
                                                                allChanged ? "border-red-300" : "",
                                                                disabled || statusIsDone ? "opacity-60" : "",
                                                            ].join(" ")}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className={`text-sm font-semibold ${allChanged ? "text-red-700" : "text-brand-text"}`}>
                                                                    {it.label}
                                                                </div>
                                                                {selected ? <Badge tone="info">ausgewählt</Badge> : <Badge tone="neutral">—</Badge>}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="obs" className="m-0">
                            <PageCard title="Beobachtungen" icon={<FileText className="h-4 w-4 text-brand-text2" />}>
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                                    <div className="text-sm text-brand-text2">
                                        Pro Beobachtung werden Tags automatisch aus den ausgewählten Anlässen erzeugt.
                                    </div>

                                    <Button
                                        variant="secondary"
                                        className="h-11"
                                        onClick={addObservation}
                                        disabled={disabled || statusIsDone}
                                    >
                                        Beobachtung hinzufügen
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {(((form as any).observations || []) as any[]).length === 0 ? (
                                        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                            Noch keine Beobachtungen.
                                        </div>
                                    ) : null}

                                    {(((form as any).observations || []) as any[]).map((o: any, idx: number) => {
                                        const tags = Array.isArray(o?.tags) ? o.tags : [];
                                        const textPath = `observations.${idx}.text`;
                                        const textChanged = isChanged(textPath);
                                        const textPrev = previousValueOf(textPath);

                                        return (
                                            <div key={idx} className="rounded-2xl border border-brand-border/25 bg-white p-3 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                    <div className="text-sm font-semibold text-brand-text">Beobachtung {idx + 1}</div>

                                                    <Button
                                                        variant="secondary"
                                                        className="h-10"
                                                        onClick={() => removeObs(idx)}
                                                        disabled={disabled || statusIsDone}
                                                    >
                                                        Entfernen
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <FieldRow label="Zeitpunkt">
                                                        <Input
                                                            value={String(o.zeitpunkt ?? "")}
                                                            onChange={(e) => updateObs(idx, { zeitpunkt: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                        />
                                                    </FieldRow>

                                                    <FieldRow label="Zeitraum">
                                                        <select
                                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                            value={pick(String(o.zeitraum ?? "EINMALIG"), OBS_ZEITRAUM, "EINMALIG")}
                                                            onChange={(e) => updateObs(idx, { zeitraum: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                        >
                                                            {OBS_ZEITRAUM.map((x) => (
                                                                <option key={x} value={x}>
                                                                    {OBS_ZEITRAUM_LABEL[x]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldRow>

                                                    <FieldRow label="Ort">
                                                        <select
                                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                            value={pick(String(o.ort ?? "SCHULE_KITA"), OBS_ORT, "SCHULE_KITA")}
                                                            onChange={(e) => updateObs(idx, { ort: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                        >
                                                            {OBS_ORT.map((x) => (
                                                                <option key={x} value={x}>
                                                                    {OBS_ORT_LABEL[x]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldRow>

                                                    {String(o.ort ?? "") === "SONSTIGES" ? (
                                                        <FieldRow label="Ort sonstiges">
                                                            <Input
                                                                value={String(o.ortSonstiges ?? "")}
                                                                onChange={(e) => updateObs(idx, { ortSonstiges: e.target.value || null })}
                                                                disabled={disabled || statusIsDone}
                                                            />
                                                        </FieldRow>
                                                    ) : null}

                                                    <FieldRow label="Quelle">
                                                        <select
                                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                            value={pick(String(o.quelle ?? "UNBEKANNT"), OBS_QUELLE, "UNBEKANNT")}
                                                            onChange={(e) => updateObs(idx, { quelle: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                        >
                                                            {OBS_QUELLE.map((x) => (
                                                                <option key={x} value={x}>
                                                                    {OBS_QUELLE_LABEL[x]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldRow>

                                                    <FieldRow label="Sichtbarkeit">
                                                        <select
                                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                            value={pick(String(o.sichtbarkeit ?? "INTERN"), SICHT, "INTERN")}
                                                            onChange={(e) => updateObs(idx, { sichtbarkeit: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                        >
                                                            {SICHT.map((x) => (
                                                                <option key={x} value={x}>
                                                                    {SICHT_LABEL[x]}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldRow>

                                                    <FieldRow
                                                        label="Beobachtungstext"
                                                        hint="Fakten/Beobachtungen – keine Interpretation."
                                                        changed={textChanged}
                                                        previousValue={textPrev}
                                                        labelClassName={changedLabelClass(textChanged)}
                                                    >
                                                        <Textarea
                                                            rows={4}
                                                            value={String(o.text ?? "")}
                                                            onChange={(e) => updateObs(idx, { text: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                            className={changedInputClass(textChanged)}
                                                            title={changeTooltip(textChanged, textPrev)}
                                                        />
                                                    </FieldRow>

                                                    <FieldRow label="Wörtliches Zitat">
                                                        <Textarea
                                                            rows={2}
                                                            value={String(o.woertlichesZitat ?? "")}
                                                            onChange={(e) => updateObs(idx, { woertlichesZitat: e.target.value || null })}
                                                            disabled={disabled || statusIsDone}
                                                        />
                                                    </FieldRow>

                                                    <FieldRow label="Körperbefund">
                                                        <Textarea
                                                            rows={2}
                                                            value={String(o.koerperbefund ?? "")}
                                                            onChange={(e) => updateObs(idx, { koerperbefund: e.target.value || null })}
                                                            disabled={disabled || statusIsDone}
                                                        />
                                                    </FieldRow>

                                                    <FieldRow label="Verhalten Kind">
                                                        <Textarea
                                                            rows={2}
                                                            value={String(o.verhaltenKind ?? "")}
                                                            onChange={(e) => updateObs(idx, { verhaltenKind: e.target.value || null })}
                                                            disabled={disabled || statusIsDone}
                                                        />
                                                    </FieldRow>

                                                    <FieldRow label="Verhalten Bezugsperson">
                                                        <Textarea
                                                            rows={2}
                                                            value={String(o.verhaltenBezug ?? "")}
                                                            onChange={(e) => updateObs(idx, { verhaltenBezug: e.target.value || null })}
                                                            disabled={disabled || statusIsDone}
                                                        />
                                                    </FieldRow>
                                                </div>

                                                <Separator />

                                                <div className="space-y-2">
                                                    <div className="text-sm font-semibold text-brand-text">Tags (automatisch aus Anlässen)</div>
                                                    {normalizeAnlassCodes((form as any).anlassCodes).length === 0 ? (
                                                        <div className="text-sm text-brand-text2">
                                                            Bitte zuerst Anlässe auswählen – danach werden Tags automatisch erzeugt.
                                                        </div>
                                                    ) : null}

                                                    <div className="grid grid-cols-1 gap-2">
                                                        {tags.map((t: any, tagIdx: number) => {
                                                            const code = String(t?.anlassCode ?? "");
                                                            const sevPath = `observations.${idx}.tags.${tagIdx}.severity`;
                                                            const comPath = `observations.${idx}.tags.${tagIdx}.comment`;
                                                            const sevChanged = isChanged(sevPath);
                                                            const comChanged = isChanged(comPath);
                                                            const sevPrev = previousValueOf(sevPath);
                                                            const comPrev = previousValueOf(comPath);

                                                            return (
                                                                <div key={code} className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                                                        <div className="min-w-0">
                                                                            <div className="text-sm font-semibold text-brand-text">{anlassLabel(code)}</div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            <Badge tone="neutral">Severity {clampSeverity(Number(t?.severity ?? 0))}</Badge>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                                        <FieldRow
                                                                            label="Severity (0–3)"
                                                                            changed={sevChanged}
                                                                            previousValue={sevPrev}
                                                                            labelClassName={changedLabelClass(sevChanged)}
                                                                        >
                                                                            <select
                                                                                className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(
                                                                                    sevChanged
                                                                                )}`}
                                                                                value={String(clampSeverity(Number(t?.severity ?? 0)))}
                                                                                onChange={(e) =>
                                                                                    updateObsTag(idx, code, { severity: clampSeverity(Number(e.target.value)) })
                                                                                }
                                                                                disabled={disabled || statusIsDone}
                                                                                title={changeTooltip(sevChanged, sevPrev)}
                                                                            >
                                                                                {[0, 1, 2, 3].map((n) => (
                                                                                    <option key={n} value={n}>
                                                                                        {n}
                                                                                    </option>
                                                                                ))}
                                                                            </select>
                                                                        </FieldRow>

                                                                        <FieldRow
                                                                            label="Kommentar / Kontext"
                                                                            changed={comChanged}
                                                                            previousValue={comPrev}
                                                                            labelClassName={changedLabelClass(comChanged)}
                                                                        >
                                                                            <Input
                                                                                value={String(t?.comment ?? "")}
                                                                                onChange={(e) => updateObsTag(idx, code, { comment: e.target.value })}
                                                                                disabled={disabled || statusIsDone}
                                                                                placeholder="kurzer Hinweis (optional)"
                                                                                className={changedInputClass(comChanged)}
                                                                                title={changeTooltip(comChanged, comPrev)}
                                                                            />
                                                                        </FieldRow>

                                                                        <FieldRow label="IndicatorId (optional)">
                                                                            <Input
                                                                                value={String(t?.indicatorId ?? "")}
                                                                                onChange={(e) => updateObsTag(idx, code, { indicatorId: e.target.value || null })}
                                                                                disabled={disabled || statusIsDone}
                                                                                placeholder="später ggf. Dropdown"
                                                                            />
                                                                        </FieldRow>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="fach" className="m-0">
                            <PageCard title="Fachbewertung" icon={<ClipboardCheck className="h-4 w-4 text-brand-text2" />}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(() => {
                                        const changed = isChanged("fachAmpel");
                                        const prev = previousValueOf("fachAmpel");
                                        return (
                                            <FieldRow
                                                label="Fach-Ampel"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <select
                                                    className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(
                                                        changed
                                                    )}`}
                                                    value={form.fachAmpel ? pick(String(form.fachAmpel), AMPEL, "GRUEN") : ""}
                                                    onChange={(e) => set("fachAmpel" as any, e.target.value || null)}
                                                    disabled={disabled || statusIsDone}
                                                    title={changeTooltip(changed, prev)}
                                                >
                                                    <option value="">—</option>
                                                    {AMPEL.map((x) => (
                                                        <option key={x} value={x}>
                                                            {AMPEL_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>
                                        );
                                    })()}

                                    {(() => {
                                        const changed = isChanged("abweichungZurAuto");
                                        const prev = previousValueOf("abweichungZurAuto");
                                        return (
                                            <FieldRow
                                                label="Abweichung zur Auto-Ampel"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <select
                                                    className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(
                                                        changed
                                                    )}`}
                                                    value={pick(String((form as any).abweichungZurAuto ?? "GLEICH"), ABW_AUTO, "GLEICH")}
                                                    onChange={(e) => set("abweichungZurAuto" as any, e.target.value as any)}
                                                    disabled={disabled || statusIsDone}
                                                    title={changeTooltip(changed, prev)}
                                                >
                                                    {ABW_AUTO.map((x) => (
                                                        <option key={x} value={x}>
                                                            {ABW_AUTO_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>
                                        );
                                    })()}

                                    {(() => {
                                        const changed = isChanged("fachText");
                                        const prev = previousValueOf("fachText");
                                        return (
                                            <FieldRow
                                                label="Fachtext"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Textarea
                                                    rows={5}
                                                    value={String((form as any).fachText ?? "")}
                                                    onChange={(e) => set("fachText" as any, e.target.value || null)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}

                                    {(() => {
                                        const changed = isChanged("abweichungsBegruendung");
                                        const prev = previousValueOf("abweichungsBegruendung");
                                        return (
                                            <FieldRow
                                                label="Begründung (falls abweichend)"
                                                hint="Pflicht, wenn Auto und Fach abweichen (empfohlen)."
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Textarea
                                                    rows={4}
                                                    value={String((form as any).abweichungsBegruendung ?? "")}
                                                    onChange={(e) => set("abweichungsBegruendung" as any, e.target.value || null)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="akut" className="m-0">
                            <PageCard title="Akut / Schutz" icon={<ShieldAlert className="h-4 w-4 text-brand-text2" />}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {(() => {
                                        const changed = isChanged("akutGefahrImVerzug");
                                        const prev = previousValueOf("akutGefahrImVerzug");
                                        return (
                                            <div
                                                className={`rounded-2xl border bg-white p-3 ${changed ? "border-red-300 bg-red-50/40" : "border-brand-border/25"}`}
                                                title={changeTooltip(changed, prev)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className={`text-sm font-semibold ${changed ? "text-red-700" : "text-brand-text"}`}>
                                                        Gefahr im Verzug
                                                    </div>
                                                    <Switch
                                                        checked={!!(form as any).akutGefahrImVerzug}
                                                        onCheckedChange={(v) => set("akutGefahrImVerzug" as any, !!v as any)}
                                                        disabled={disabled || statusIsDone}
                                                    />
                                                </div>
                                                {changed ? <div className="mt-2 text-xs text-red-700">Vorher: {renderPreviousValue(prev)}</div> : null}
                                                <div className={`mt-2 text-xs ${changed ? "text-red-700/80" : "text-brand-text2"}`}>
                                                    Nur setzen, wenn eine sofortige Intervention erforderlich ist.
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <FieldRow label="Notruf erforderlich">
                                        <select
                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                            value={String((form as any).akutNotrufErforderlich ?? "")}
                                            onChange={(e) => set("akutNotrufErforderlich" as any, e.target.value === "" ? null : e.target.value === "true")}
                                            disabled={disabled || statusIsDone}
                                        >
                                            <option value="">—</option>
                                            <option value="true">Ja</option>
                                            <option value="false">Nein</option>
                                        </select>
                                    </FieldRow>

                                    <FieldRow label="Kind sicher untergebracht">
                                        <select
                                            className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                            value={pick(String((form as any).akutKindSicherUntergebracht ?? "UNKLAR"), JANEINUNKLAR, "UNKLAR")}
                                            onChange={(e) => set("akutKindSicherUntergebracht" as any, e.target.value as any)}
                                            disabled={disabled || statusIsDone}
                                        >
                                            {JANEINUNKLAR.map((x) => (
                                                <option key={x} value={x}>
                                                    {JNU_LABEL[x]}
                                                </option>
                                            ))}
                                        </select>
                                    </FieldRow>

                                    {(() => {
                                        const changed = isChanged("akutBegruendung");
                                        const prev = previousValueOf("akutBegruendung");
                                        return (
                                            <FieldRow
                                                label="Begründung / Maßnahmen (Akut)"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Textarea
                                                    rows={5}
                                                    value={String((form as any).akutBegruendung ?? "")}
                                                    onChange={(e) => set("akutBegruendung" as any, e.target.value || null)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}
                                </div>

                                <Separator />

                                <div className="space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
                                            <Building2 className="h-4 w-4 text-brand-text2" />
                                            Jugendamt
                                        </div>

                                        {(form as any).jugendamt ? (
                                            <Button variant="secondary" className="h-10" onClick={clearJugendamt} disabled={disabled || statusIsDone}>
                                                Jugendamt-Block entfernen
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" className="h-10" onClick={ensureJugendamt} disabled={disabled || statusIsDone}>
                                                Jugendamt erfassen
                                            </Button>
                                        )}
                                    </div>

                                    {(form as any).jugendamt ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-brand-border/25 bg-white p-3">
                                            <FieldRow label="Jugendamt informiert">
                                                <select
                                                    className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                    value={pick(
                                                        String((form as any).jugendamt?.informiert ?? "UNKLAR"),
                                                        JANEINUNKLAR,
                                                        "UNKLAR"
                                                    )}
                                                    onChange={(e) => setJugendamt({ informiert: e.target.value })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    {JANEINUNKLAR.map((x) => (
                                                        <option key={x} value={x}>
                                                            {JNU_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>

                                            <FieldRow label="Kontakt am">
                                                <Input
                                                    value={String((form as any).jugendamt?.kontaktAm ?? "")}
                                                    onChange={(e) => setJugendamt({ kontaktAm: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                    placeholder={nowIso()}
                                                />
                                            </FieldRow>

                                            <FieldRow label="Kontaktart">
                                                <select
                                                    className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                    value={String((form as any).jugendamt?.kontaktart ?? "")}
                                                    onChange={(e) => setJugendamt({ kontaktart: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    <option value="">—</option>
                                                    {KONTAKTART.map((x) => (
                                                        <option key={x} value={x}>
                                                            {KONTAKTART_LABEL[x]}
                                                        </option>
                                                    ))}
                                                </select>
                                            </FieldRow>

                                            <FieldRow label="Aktenzeichen">
                                                <Input
                                                    value={String((form as any).jugendamt?.aktenzeichen ?? "")}
                                                    onChange={(e) => setJugendamt({ aktenzeichen: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                />
                                            </FieldRow>

                                            <FieldRow label="Begründung" hint="Warum wurde das Jugendamt informiert oder bewusst nicht informiert?">
                                                <Textarea
                                                    rows={4}
                                                    value={String((form as any).jugendamt?.begruendung ?? "")}
                                                    onChange={(e) => setJugendamt({ begruendung: e.target.value || null })}
                                                    disabled={disabled || statusIsDone}
                                                />
                                            </FieldRow>
                                        </div>
                                    ) : null}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="kontakte" className="m-0">
                            <PageCard title="Kontakte" icon={<Phone className="h-4 w-4 text-brand-text2" />}>
                                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                                    <div className="text-sm text-brand-text2">
                                        Gesprächs-, Kontakt- und Erreichbarkeitsverlauf dokumentieren.
                                    </div>

                                    <Button
                                        variant="secondary"
                                        className="h-11"
                                        onClick={addContact}
                                        disabled={disabled || statusIsDone}
                                    >
                                        Kontakt hinzufügen
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {(((form as any).contacts || []) as any[]).length === 0 ? (
                                        <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                            Noch keine Kontakte erfasst.
                                        </div>
                                    ) : null}

                                    {(((form as any).contacts || []) as any[]).map((c: any, idx: number) => (
                                        <div key={idx} className="rounded-2xl border border-brand-border/25 bg-white p-3 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div className="text-sm font-semibold text-brand-text">Kontakt {idx + 1}</div>

                                                <Button
                                                    variant="secondary"
                                                    className="h-10"
                                                    onClick={() => removeContact(idx)}
                                                    disabled={disabled || statusIsDone}
                                                >
                                                    Entfernen
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <FieldRow label="Kontakt mit">
                                                    <select
                                                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                        value={pick(String(c.kontaktMit ?? "SONSTIGE"), KONTAKT_MIT, "SONSTIGE")}
                                                        onChange={(e) => updateContact(idx, { kontaktMit: e.target.value })}
                                                        disabled={disabled || statusIsDone}
                                                    >
                                                        {KONTAKT_MIT.map((x) => (
                                                            <option key={x} value={x}>
                                                                {KONTAKT_MIT_LABEL[x]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FieldRow>

                                                <FieldRow label="Kontakt am">
                                                    <Input
                                                        value={String(c.kontaktAm ?? "")}
                                                        onChange={(e) => updateContact(idx, { kontaktAm: e.target.value || null })}
                                                        disabled={disabled || statusIsDone}
                                                        placeholder={nowIso()}
                                                    />
                                                </FieldRow>

                                                <FieldRow label="Status">
                                                    <select
                                                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                                        value={pick(String(c.status ?? "GEPLANT"), KONTAKT_STATUS, "GEPLANT")}
                                                        onChange={(e) => updateContact(idx, { status: e.target.value })}
                                                        disabled={disabled || statusIsDone}
                                                    >
                                                        {KONTAKT_STATUS.map((x) => (
                                                            <option key={x} value={x}>
                                                                {KONTAKT_STATUS_LABEL[x]}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FieldRow>

                                                <FieldRow label="Ergebnis">
                                                    <Input
                                                        value={String(c.ergebnis ?? "")}
                                                        onChange={(e) => updateContact(idx, { ergebnis: e.target.value || null })}
                                                        disabled={disabled || statusIsDone}
                                                        placeholder="z.B. Rückruf zugesagt / erreicht / Termin vereinbart"
                                                    />
                                                </FieldRow>

                                                <FieldRow label="Notiz">
                                                    <Textarea
                                                        rows={3}
                                                        value={String(c.notiz ?? "")}
                                                        onChange={(e) => updateContact(idx, { notiz: e.target.value || null })}
                                                        disabled={disabled || statusIsDone}
                                                    />
                                                </FieldRow>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="planung" className="m-0">
                            <PageCard title="Planung" icon={<ClipboardCheck className="h-4 w-4 text-brand-text2" />}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <FieldRow label="Verantwortliche Fachkraft (UserId)">
                                        <Input
                                            value={String((form as any).verantwortlicheFachkraftUserId ?? "")}
                                            onChange={(e) => set("verantwortlicheFachkraftUserId" as any, e.target.value || null)}
                                            disabled={disabled || statusIsDone}
                                        />
                                    </FieldRow>

                                    <FieldRow label="Nächste Überprüfung am (YYYY-MM-DD)">
                                        <Input
                                            value={String((form as any).naechsteUeberpruefungAm ?? "")}
                                            onChange={(e) => set("naechsteUeberpruefungAm" as any, e.target.value || null)}
                                            disabled={disabled || statusIsDone}
                                            placeholder="2026-03-06"
                                        />
                                    </FieldRow>

                                    {(() => {
                                        const changed = isChanged("zusammenfassung");
                                        const prev = previousValueOf("zusammenfassung");
                                        return (
                                            <FieldRow
                                                label="Zusammenfassung"
                                                changed={changed}
                                                previousValue={prev}
                                                labelClassName={changedLabelClass(changed)}
                                            >
                                                <Textarea
                                                    rows={4}
                                                    value={String((form as any).zusammenfassung ?? "")}
                                                    onChange={(e) => set("zusammenfassung" as any, e.target.value || null)}
                                                    disabled={disabled || statusIsDone}
                                                    className={changedInputClass(changed)}
                                                    title={changeTooltip(changed, prev)}
                                                />
                                            </FieldRow>
                                        );
                                    })()}
                                </div>
                            </PageCard>
                        </TabsContent>

                        <TabsContent value="save" className="m-0">
                            <PageCard title="Speichern & Abschluss" icon={<Save className="h-4 w-4 text-brand-text2" />}>
                                <div className="rounded-2xl border border-brand-border/25 bg-white p-3 space-y-2">
                                    <div className="text-sm font-semibold text-brand-text">Notizen spiegeln</div>
                                    <div className="text-sm text-brand-text2">
                                        Optional: Abschluss in die Notizen übernehmen (je nach Teamprozess).
                                    </div>
                                    <div className="flex items-center justify-between rounded-2xl border border-brand-border/25 p-3">
                                        <div className="text-sm text-brand-text">Beim Abschließen spiegeln</div>
                                        <Switch checked={submitMirror} onCheckedChange={(v) => setSubmitMirror(!!v)} disabled={disabled || statusIsDone} />
                                    </div>
                                </div>

                                {isCorrection ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 p-3 space-y-2">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-red-700">Korrektur: Änderungsgrund erforderlich</div>
                                                <div className="text-sm text-red-700/90">
                                                    Für Korrekturen muss dokumentiert werden, <span className="font-semibold">was</span> geändert wurde und
                                                    <span className="font-semibold"> warum</span>.
                                                </div>
                                            </div>
                                        </div>

                                        <FieldRow
                                            label="Änderungsgrund (Pflicht)"
                                            labelClassName="text-red-700"
                                            changed={!!String(changeReason ?? "").trim()}
                                            previousValue=""
                                            hint="Wird beim Submit als changeReason an das Backend gesendet."
                                        >
                                            <Textarea
                                                rows={4}
                                                value={changeReason}
                                                onChange={(e) => setChangeReason(e.target.value)}
                                                disabled={disabled || statusIsDone}
                                                placeholder="z.B. falsche Angabe korrigiert / neue Information nach Rückruf / Datenabgleich mit Arzt …"
                                                className="border-red-300 bg-red-50/40 focus-visible:ring-red-300"
                                                title="Pflichtfeld für Korrekturen"
                                            />
                                        </FieldRow>

                                        {!String(changeReason ?? "").trim() ? (
                                            <div className="text-xs text-red-700">
                                                Ohne Änderungsgrund kann diese Korrektur nicht abgeschlossen werden.
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                        variant="secondary"
                                        className="h-11 gap-2 w-full sm:w-auto"
                                        onClick={doSave}
                                        disabled={disabled || statusIsDone || saving}
                                    >
                                        <Save className="h-4 w-4" />
                                        Entwurf speichern
                                    </Button>

                                    <Button className="h-11 gap-2 w-full sm:w-auto" onClick={doSubmit} disabled={submitDisabled}>
                                        <CheckCircle2 className="h-4 w-4" />
                                        Abschließen
                                    </Button>
                                </div>

                                <div className="text-xs text-brand-text2">
                                    Hinweis: „Abschließen“ nutzt den Submit-Endpunkt. Entwurf-Speichern löst keinen Änderungsgrund aus.
                                </div>
                            </PageCard>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </div>
    );
}

export default MeldungEditor;