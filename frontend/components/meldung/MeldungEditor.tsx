"use client";

import * as React from "react";
import type { MeldungDraftRequest, MeldungResponse } from "@/lib/api/meldung";
import { ANLASS_CATALOG, ANLASS_CODES, ANLASS_DEFAULT_SEVERITY, anlassLabel } from "@/lib/anlass/catalog";
import { meldebogenApi } from "@/lib/api/meldebogen";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    ABW_AUTO,
    ABW_AUTO_LABEL,
    AMPEL,
    AMPEL_LABEL,
    JANEINUNKLAR,
    JNU_LABEL,
    KONTAKTART,
    KONTAKTART_LABEL,
    KONTAKT_MIT,
    KONTAKT_MIT_LABEL,
    KONTAKT_STATUS,
    KONTAKT_STATUS_LABEL,
    OBS_ORT,
    OBS_ORT_LABEL,
    OBS_QUELLE,
    OBS_QUELLE_LABEL,
    OBS_ZEITRAUM,
    OBS_ZEITRAUM_LABEL,
    SICHT,
    SICHT_LABEL,
    WORKFLOW_STEPS,
} from "./meldungEditor.constants";
import {
    changeTooltip,
    changedInputClass,
    changedLabelClass,
    clampSeverity,
    getByPath,
    isDoneStatus,
    isSameValue,
    nowIso,
    pick,
    todayLocalDate,
    toErrorMessage,
} from "./meldungEditor.helpers";
import { MeldungBasisSection } from "./MeldungBasisSection";
import { FieldRow, SectionCard } from "./MeldungEditor.ui";
import type { MelderInfo, ObservationDraft, StepStatus, TagDraft, WorkflowStepKey } from "./meldungEditor.types";
import { COMPANION_BOGEN_PLUGINS } from "./meldungEditor.plugins";

import {
    FileText,
    ClipboardCheck,
    Save,
    CheckCircle2,
    AlertTriangle,
    Building2,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ListChecks,
    Layers3,
} from "lucide-react";

/* ============================================================================
 * ZIEL DIESES REFACTORS
 * ----------------------------------------------------------------------------
 * Der ursprüngliche Editor war technisch funktional, fachlich aber zu stark in
 * Einzel-Tabs zerschnitten. Dieser Refactor baut den Editor zu einem linearen
 * Workflow um:
 *
 * 1. Aufnahme
 * 2. Einschätzung
 * 3. Schutz & Kontakte
 * 4. Planung
 * 5. Abschluss
 *
 * Wichtige technische Änderungen:
 * - EIN zentraler Save-Pfad für Meldung + Companion-Bögen
 * - Schrittbasierte UI statt vieler gleichrangiger Tabs
 * - Mapping-Funktionen pro Backend-Objekt
 * - zusätzliche Kommentare direkt im Code
 * ========================================================================== */


/**
 * WICHTIG ZUR INTEGRATION
 * ----------------------
 * Dieser Editor speichert Entwurf und Companion-Bögen über einen gemeinsamen
 * Persistenzpfad. Damit das vollständig funktioniert, darf der Parent in
 * onSaveDraft() NICHT sofort navigieren. In eurer Route
 * app/dashboard/kinder/[id]/akte/page.tsx macht onSaveDraft derzeit direkt
 * goToAkte(updated). Das sollte in den Parent verlagert werden, nachdem der
 * Editor seinen gesamten Persistenzlauf beendet hat.
 */

type ContactDraft = NonNullable<MeldungDraftRequest["contacts"]>[number];
type JugendamtDraft = NonNullable<MeldungDraftRequest["jugendamt"]>;

/* ---------------- Auto-Ampel ---------------- */

function ampToRank(a: string | null | undefined): number {
    if (a === "GRUEN") return 0;
    if (a === "GELB") return 1;
    if (a === "ROT") return 2;
    return -1;
}

function computeAutoAssessment(form: MeldungDraftRequest) {
    const obs = form.observations ?? [];

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
    const repeatedCount = obs.filter((o) => o?.zeitraum === "WIEDERHOLT").length;

    const akutBonus = (form.akutGefahrImVerzug ? 1.25 : 0) + (form.akutNotrufErforderlich ? 0.75 : 0);
    const score = maxSeverity * 2.0 + avgSeverity + Math.min(2, repeatedCount) * 0.5 + akutBonus;

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
        erfasstVonRolle: v.erfasstVonRolle ?? "",
        meldeweg: v.meldeweg ?? "TELEFON",
        meldewegSonstiges: v.meldewegSonstiges ?? null,
        meldendeStelleKontakt: v.meldendeStelleKontakt ?? null,
        dringlichkeit: v.dringlichkeit ?? "UNKLAR",
        datenbasis: v.datenbasis ?? "UNKLAR",
        einwilligungVorhanden: v.einwilligungVorhanden ?? null,
        schweigepflichtentbindungVorhanden: v.schweigepflichtentbindungVorhanden ?? null,
        kurzbeschreibung: v.kurzbeschreibung ?? "",
        fachAmpel: v.fachAmpel ?? null,
        fachText: v.fachText ?? null,
        abweichungZurAuto: v.abweichungZurAuto ?? "GLEICH",
        abweichungsBegruendung: v.abweichungsBegruendung ?? null,
        akutGefahrImVerzug: v.akutGefahrImVerzug ?? false,
        akutBegruendung: v.akutBegruendung ?? null,
        akutNotrufErforderlich: v.akutNotrufErforderlich ?? null,
        akutKindSicherUntergebracht: v.akutKindSicherUntergebracht ?? "UNKLAR",
        verantwortlicheFachkraftUserId: v.verantwortlicheFachkraftUserId ?? null,
        naechsteUeberpruefungAm: v.naechsteUeberpruefungAm ?? null,
        zusammenfassung: v.zusammenfassung ?? null,
        anlassCodes: v.anlassCodes ?? [],

        observations: v.observations.map((o) => ({
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
            tags: o.tags.map((t) => ({
                anlassCode: t.anlassCode ?? null,
                indicatorId: t.indicatorId ?? null,
                severity: t.severity ?? null,
                comment: t.comment ?? null,
            })),
        })),

        jugendamt: v.jugendamt
            ? {
                informiert: v.jugendamt.informiert ?? null,
                kontaktAm: v.jugendamt.kontaktAm ?? null,
                kontaktart: v.jugendamt.kontaktart ?? null,
                aktenzeichen: v.jugendamt.aktenzeichen ?? null,
                begruendung: v.jugendamt.begruendung ?? null,
            }
            : null,

        contacts: v.contacts.map((c) => ({
            kontaktMit: c.kontaktMit ?? "SONSTIGE",
            kontaktAm: c.kontaktAm ?? null,
            status: c.status ?? "GEPLANT",
            notiz: c.notiz ?? null,
            ergebnis: c.ergebnis ?? null,
        })),

        extern: v.extern.map((x) => ({
            stelle: x.stelle ?? "SONSTIGE",
            stelleSonstiges: x.stelleSonstiges ?? null,
            am: x.am ?? null,
            begruendung: x.begruendung ?? null,
            ergebnis: x.ergebnis ?? null,
        })),

        attachments: v.attachments.map((a) => ({
            fileId: a.fileId ?? null,
            typ: a.typ ?? "DOKUMENT",
            titel: a.titel ?? null,
            beschreibung: a.beschreibung ?? null,
            sichtbarkeit: a.sichtbarkeit ?? "INTERN",
            rechtsgrundlageHinweis: a.rechtsgrundlageHinweis ?? null,
        })),

        sectionReasons: {},
    };
}

/* ---------------- Auto-Tag Generation ---------------- */

function normalizeAnlassCodes(input: unknown): string[] {
    const arr = Array.isArray(input) ? input : [];
    const codes = arr.filter((x): x is string => typeof x === "string" && ANLASS_CODES.includes(x));
    return [...new Set(codes)];
}

function syncObsTagsToAnlassCodes(observation: ObservationDraft, anlassCodes: string[]) {
    const existing = Array.isArray(observation?.tags) ? observation.tags : [];
    const byCode = new Map<string, TagDraft>();

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
    const anlassCodes = normalizeAnlassCodes(form.anlassCodes);
    const obs = form.observations ?? [];
    const nextObs = obs.map((o) => syncObsTagsToAnlassCodes(o, anlassCodes));
    return { ...form, anlassCodes, observations: nextObs };
}

/* ---------------- Mapping helper for companion forms ---------------- */

function mapToMeldebogenRequest(form: MeldungDraftRequest, melderInfo: MelderInfo) {
    const MELDEWEG_TO_MELDUNGART: Record<string, string> = {
        TELEFON: "TELEFONISCH",
        EMAIL: "EMAIL",
        PERSOENLICH: "PERSOENLICH",
        BRIEF: "SCHRIFTLICH",
        SONSTIGES: "PERSOENLICH",
    };

    const DRING_TO_HANDLUNG: Record<string, string> = {
        AKUT_HEUTE: "SOFORT",
        ZEITNAH_24_48H: "INNERHALB_24H",
        BEOBACHTEN: "INNERHALB_WOCHE",
        UNKLAR: "SPAETER",
    };

    const AMPEL_TO_ERST: Record<string, string> = { GRUEN: "KEINE", GELB: "GERING", ROT: "AKUT" };

    return {
        eingangsdatum: todayLocalDate(),
        erfassendeFachkraft: String(form.erfasstVonRolle ?? "").trim() || null,
        meldungart: MELDEWEG_TO_MELDUNGART[form.meldeweg ?? ""] ?? null,
        melderName: melderInfo.melderName || null,
        melderKontakt: melderInfo.melderKontakt || null,
        melderBeziehungKind: melderInfo.melderBeziehungKind || null,
        melderGlaubwuerdigkeit: melderInfo.melderGlaubwuerdigkeit || null,
        schilderung: form.kurzbeschreibung || null,
        kindAktuellerAufenthalt: melderInfo.kindAktuellerAufenthalt || null,
        belastungKoerperlErkrankung: melderInfo.belastungKoerperlErkrankung,
        belastungPsychErkrankung: melderInfo.belastungPsychErkrankung,
        belastungSucht: melderInfo.belastungSucht,
        belastungHaeuslicheGewalt: melderInfo.belastungHaeuslicheGewalt,
        belastungSuizidgefahr: melderInfo.belastungSuizidgefahr,
        belastungGewalttaetigeErz: melderInfo.belastungGewalttaetigeErz,
        belastungSozialeIsolation: melderInfo.belastungSozialeIsolation,
        belastungSonstiges: melderInfo.belastungSonstiges || null,
        ersteinschaetzung: AMPEL_TO_ERST[form.fachAmpel ?? ""] ?? null,
        handlungsdringlichkeit: DRING_TO_HANDLUNG[form.dringlichkeit ?? ""] ?? null,
        ersteinschaetzungFreitext: form.fachText || null,
    };
}

/* ---------------- UI bits ---------------- */

function PageCard(props: { title: string; icon?: React.ReactNode; children: React.ReactNode; description?: string }) {
    return (
        <Card className="rounded-3xl border border-brand-border/25 shadow-[0_12px_28px_rgba(15,23,42,0.08)] bg-white">
            <CardHeader className="gap-1 pb-4">
                <CardTitle className="text-lg font-semibold text-brand-text flex items-center gap-2">
                    {props.icon}
                    {props.title}
                </CardTitle>
                {props.description ? <div className="text-sm text-brand-text2 leading-relaxed">{props.description}</div> : null}
            </CardHeader>
            <CardContent className="space-y-5">{props.children}</CardContent>
        </Card>
    );
}

function StepBadge({ status }: { status: StepStatus }) {
    return <Badge tone={status === "done" ? "success" : "neutral"}>{status === "done" ? "fertig" : "offen"}</Badge>;
}

/* ---------------- Component ---------------- */

export function MeldungEditor(props: {
    fallId: number;
    value: MeldungResponse;
    disabled?: boolean;
    onSaveDraftAction?: (req: MeldungDraftRequest) => Promise<MeldungResponse | void>;
    onSubmitAction?: (mirrorToNotizen: boolean, changeReason?: string) => Promise<void>;
}) {
    const { fallId, value, disabled = false, onSaveDraftAction, onSubmitAction } = props;
    const saveDraftFn = onSaveDraftAction;
    const submitFn = onSubmitAction;

    const statusIsDone = isDoneStatus(value.status);

    const isCorrection = React.useMemo(() => {
        const t = String(value.type ?? "").toUpperCase();
        const correctsId = value.correctsId;
        return t === "KORREKTUR" || (typeof correctsId === "number" && correctsId > 0);
    }, [value]);

    const [activeStep, setActiveStep] = React.useState<WorkflowStepKey>("aufnahme");

    const [form, setForm] = React.useState<MeldungDraftRequest>(() => syncAllObservations(toDraftFromResponse(value)));
    const initialDraftRef = React.useRef<MeldungDraftRequest>(syncAllObservations(toDraftFromResponse(value)));

    const [saving, setSaving] = React.useState(false);
    const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
    const [validationErr, setValidationErr] = React.useState<string | null>(null);
    const [submitErr, setSubmitErr] = React.useState<string | null>(null);

    const [submitMirror, setSubmitMirror] = React.useState(true);
    const [changeReason, setChangeReason] = React.useState("");

    const stepCardRef = React.useRef<HTMLDivElement | null>(null);

    const [melderInfo, setMelderInfo] = React.useState<MelderInfo>({
        melderName: "",
        melderKontakt: "",
        melderBeziehungKind: "",
        melderGlaubwuerdigkeit: null as string | null,
        kindAktuellerAufenthalt: "",
        belastungKoerperlErkrankung: false,
        belastungPsychErkrankung: false,
        belastungSucht: false,
        belastungHaeuslicheGewalt: false,
        belastungSuizidgefahr: false,
        belastungGewalttaetigeErz: false,
        belastungSozialeIsolation: false,
        belastungSonstiges: "",
    });

    const [companionIds, setCompanionIds] = React.useState<{ meldebogenId: number | null }>({
        meldebogenId: null,
    });

    /* -----------------------------------------------------------------------
     * Plugin slot state: one entry per registered CompanionBogenPlugin.
     * Each slot holds the id of the persisted record (null = not yet created)
     * and the current form state managed by the plugin.
     * --------------------------------------------------------------------- */
    const [pluginSlots, setPluginSlots] = React.useState<Record<string, { id: number | null; state: unknown }>>(
        () => Object.fromEntries(COMPANION_BOGEN_PLUGINS.map((p) => [p.key, { id: null, state: p.defaultState() }])),
    );

    /* ------------------------------------------------------------------------
     * Load companion Bögen: catalogs + any existing records for this fall.
     * Each registered plugin's loadInitial() handles its own catalog and data
     * fetching, so adding a new Bogen requires no changes here.
     * ---------------------------------------------------------------------- */
    React.useEffect(() => {
        let cancelled = false;

        async function loadAll() {
            const hasMeaningfulDraftData =
                Boolean(String(value.kurzbeschreibung ?? "").trim()) ||
                Boolean((value.observations ?? []).length) ||
                Boolean((value.contacts ?? []).length) ||
                Boolean(value.jugendamt) ||
                Boolean(String(value.zusammenfassung ?? "").trim());

            if (!isCorrection && !hasMeaningfulDraftData) return;

            // Load all plugins in parallel – each plugin owns its catalog + data loading
            const pluginResults = await Promise.allSettled(
                COMPANION_BOGEN_PLUGINS.map((plugin) =>
                    plugin.loadInitial(fallId).then((result) => ({ key: plugin.key, ...result })),
                ),
            );

            if (cancelled) return;

            setPluginSlots((prev) => {
                const next = { ...prev };
                for (const r of pluginResults) {
                    if (r.status === "fulfilled") {
                        next[r.value.key] = { id: r.value.id, state: r.value.state };
                    }
                }
                return next;
            });

            // Meldebogen is loaded inline (it feeds into MeldungBasisSection)
            try {
                const meldeboegen = await (meldebogenApi.list?.(fallId).catch(() => []) ?? []);
                if (cancelled) return;
                const meldebogenItem = Array.isArray(meldeboegen) && meldeboegen.length ? meldeboegen[0] : null;
                if (meldebogenItem?.id) {
                    setCompanionIds((prev) => ({ ...prev, meldebogenId: meldebogenItem.id }));
                    if (meldebogenApi.get) {
                        const mb = await meldebogenApi.get(fallId, meldebogenItem.id).catch(() => null);
                        if (!cancelled && mb) {
                            setMelderInfo({
                                melderName: mb.melderName ?? "",
                                melderKontakt: mb.melderKontakt ?? "",
                                melderBeziehungKind: mb.melderBeziehungKind ?? "",
                                melderGlaubwuerdigkeit: mb.melderGlaubwuerdigkeit ?? null,
                                kindAktuellerAufenthalt: mb.kindAktuellerAufenthalt ?? "",
                                belastungKoerperlErkrankung: Boolean(mb.belastungKoerperlErkrankung),
                                belastungPsychErkrankung: Boolean(mb.belastungPsychErkrankung),
                                belastungSucht: Boolean(mb.belastungSucht),
                                belastungHaeuslicheGewalt: Boolean(mb.belastungHaeuslicheGewalt),
                                belastungSuizidgefahr: Boolean(mb.belastungSuizidgefahr),
                                belastungGewalttaetigeErz: Boolean(mb.belastungGewalttaetigeErz),
                                belastungSozialeIsolation: Boolean(mb.belastungSozialeIsolation),
                                belastungSonstiges: mb.belastungSonstiges ?? "",
                            });
                        }
                    }
                }
            } catch {
                // non-critical
            }
        }

        loadAll();
        return () => {
            cancelled = true;
        };
    }, [
        fallId,
        value.id,
        value.kurzbeschreibung,
        value.observations,
        value.contacts,
        value.jugendamt,
        value.zusammenfassung,
        isCorrection,
    ]);

    React.useEffect(() => {
        const nextDraft = syncAllObservations(toDraftFromResponse(value));
        initialDraftRef.current = nextDraft;
        setForm(nextDraft);

        setMelderInfo({
            melderName: "",
            melderKontakt: "",
            melderBeziehungKind: "",
            melderGlaubwuerdigkeit: null,
            kindAktuellerAufenthalt: "",
            belastungKoerperlErkrankung: false,
            belastungPsychErkrankung: false,
            belastungSucht: false,
            belastungHaeuslicheGewalt: false,
            belastungSuizidgefahr: false,
            belastungGewalttaetigeErz: false,
            belastungSozialeIsolation: false,
            belastungSonstiges: "",
        });

        setCompanionIds({
            meldebogenId: null,
        });

        setPluginSlots(
            Object.fromEntries(COMPANION_BOGEN_PLUGINS.map((p) => [p.key, { id: null, state: p.defaultState() }])),
        );

        setSaveMsg(null);
        setValidationErr(null);
        setSubmitErr(null);
        setChangeReason("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value.id]);

    const set = <K extends keyof MeldungDraftRequest>(k: K, v: MeldungDraftRequest[K]) =>
        setForm((s) => syncAllObservations({ ...s, [k]: v }));

    const isChanged = React.useCallback(
        (path: string) => {
            if (!isCorrection) return false;
            const before = getByPath(initialDraftRef.current, path);
            const after = getByPath(form, path);
            return !isSameValue(before, after);
        },
        [form, isCorrection],
    );

    const previousValueOf = React.useCallback((path: string) => getByPath(initialDraftRef.current, path), []);

    const toggleAnlass = (code: string) => {
        setForm((prev) => {
            const cur = new Set(normalizeAnlassCodes(prev.anlassCodes));
            if (cur.has(code)) cur.delete(code);
            else cur.add(code);
            const next = { ...prev, anlassCodes: Array.from(cur) };
            return syncAllObservations(next);
        });
    };

    const addObservation = () => {
        setForm((prev) => {
            const obs = [...(prev.observations ?? [])];
            obs.push({
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
            });
            return syncAllObservations({ ...prev, observations: obs });
        });
    };

    const updateObs = (idx: number, patch: Partial<ObservationDraft>) => {
        setForm((prev) => {
            const obs = [...(prev.observations ?? [])];
            obs[idx] = { ...(obs[idx] ?? {}), ...patch };
            return syncAllObservations({ ...prev, observations: obs });
        });
    };

    const removeObs = (idx: number) => {
        setForm((prev) => {
            const obs = [...(prev.observations ?? [])];
            obs.splice(idx, 1);
            return syncAllObservations({ ...prev, observations: obs });
        });
    };

    const updateObsTag = (obsIdx: number, anlassCode: string, patch: Partial<TagDraft>) => {
        setForm((prev) => {
            const obs = [...(prev.observations ?? [])];
            const o = obs[obsIdx];
            if (!o) return prev;

            const tags = Array.isArray(o.tags) ? [...o.tags] : [];
            const i = tags.findIndex((t) => t?.anlassCode === anlassCode);
            if (i < 0) return prev;

            tags[i] = { ...tags[i], ...patch, anlassCode };
            obs[obsIdx] = { ...o, tags };

            return syncAllObservations({ ...prev, observations: obs });
        });
    };

    const addContact = () => {
        setForm((prev) => {
            const list = [...(prev.contacts ?? [])];
            list.push({
                kontaktMit: "SONSTIGE",
                kontaktAm: nowIso(),
                status: "GEPLANT",
                notiz: null,
                ergebnis: null,
            });
            return { ...prev, contacts: list };
        });
    };

    const updateContact = (idx: number, patch: Partial<ContactDraft>) => {
        setForm((prev) => {
            const list = [...(prev.contacts ?? [])];
            list[idx] = { ...(list[idx] ?? {}), ...patch };
            return { ...prev, contacts: list };
        });
    };

    const removeContact = (idx: number) => {
        setForm((prev) => {
            const list = [...(prev.contacts ?? [])];
            list.splice(idx, 1);
            return { ...prev, contacts: list };
        });
    };

    const ensureJugendamt = () => {
        setForm((prev) => {
            if (prev.jugendamt) return prev;
            return {
                ...prev,
                jugendamt: { informiert: null, kontaktAm: null, kontaktart: null, aktenzeichen: null, begruendung: null },
            };
        });
    };

    const clearJugendamt = () => setForm((prev) => ({ ...prev, jugendamt: null }));

    const setJugendamt = (patch: Partial<JugendamtDraft>) => {
        setForm((prev) => ({
            ...prev,
            jugendamt: {
                informiert: null,
                kontaktAm: null,
                kontaktart: null,
                aktenzeichen: null,
                begruendung: null,
                ...(prev.jugendamt ?? {}),
                ...patch,
            },
        }));
    };

    function validateForSaveUI(): string | null {
        const kb = String(form.kurzbeschreibung ?? "").trim();
        if (!kb) return "Kurzbeschreibung (Sachlage) ist erforderlich.";
        return null;
    }

    function validateForSubmitUI(): string | null {
        const base = validateForSaveUI();
        if (base) return base;

        if (normalizeAnlassCodes(form.anlassCodes).length === 0) return "Bitte mindestens einen Anlass auswählen.";
        if ((form.observations ?? []).length === 0) return "Bitte mindestens eine Beobachtung erfassen.";
        if (!String(form.naechsteUeberpruefungAm ?? "").trim()) {
            return "Nächste Überprüfung am ist erforderlich.";
        }
        if (isCorrection && !String(changeReason ?? "").trim()) {
            return "Änderungsgrund ist erforderlich (Pflicht bei Korrektur).";
        }
        return null;
    }

    const persistAll = React.useCallback(async () => {
        const normalized = syncAllObservations(form);
        if (!saveDraftFn) throw new Error("onSaveDraft/onSaveDraftAction fehlt.");
        await saveDraftFn(normalized);

        try {
            const meldebogenReq = mapToMeldebogenRequest(normalized, melderInfo);
            if (companionIds.meldebogenId) {
                await meldebogenApi.update(fallId, companionIds.meldebogenId, meldebogenReq);
            } else {
                const result = await meldebogenApi.create(fallId, meldebogenReq);
                setCompanionIds((prev) => ({ ...prev, meldebogenId: result.id }));
            }
        } catch {}

        await Promise.allSettled(
            COMPANION_BOGEN_PLUGINS.map(async (plugin) => {
                const slot = pluginSlots[plugin.key];
                if (!slot) return;
                if (plugin.isEnabled && !plugin.isEnabled({ mainForm: normalized, state: slot.state })) return;
                try {
                    const newId = await plugin.save(fallId, slot.id, slot.state);
                    if (newId !== slot.id) {
                        setPluginSlots((prev) => ({ ...prev, [plugin.key]: { ...prev[plugin.key], id: newId } }));
                    }
                } catch {}
            }),
        );
    }, [
        companionIds,
        fallId,
        form,
        melderInfo,
        pluginSlots,
        saveDraftFn,
    ]);

    const doSave = async () => {
        setSaveMsg(null);
        setSubmitErr(null);

        const vErr = validateForSaveUI();
        setValidationErr(vErr);
        if (vErr) return;

        setSaving(true);
        try {
            await persistAll();
            setSaveMsg("Entwurf gespeichert. Meldung und Begleitbögen wurden gemeinsam persistiert.");
        } catch (e: unknown) {
            setSaveMsg(null);
            setSubmitErr(toErrorMessage(e, "Speichern fehlgeschlagen."));
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

        if (!submitFn) { setSubmitErr("onSubmitAction fehlt."); return; }

        setSaving(true);
        try {
            await persistAll();
            const trimmed = String(changeReason ?? "").trim();
            await submitFn(submitMirror, isCorrection ? trimmed : undefined);
            setSaveMsg("Meldung abgeschlossen.");
        } catch (e: unknown) {
            setSaveMsg(null);
            setSubmitErr(toErrorMessage(e, "Abschließen fehlgeschlagen."));
        } finally {
            setSaving(false);
        }
    };

    const auto = React.useMemo(() => computeAutoAssessment(form), [form]);
    const fachAmpel = form.fachAmpel ?? null;
    const computedAbw = computeAbweichungZurAuto(fachAmpel, auto.autoAmpel);

    React.useEffect(() => {
        setForm((prev) => {
            const cur = prev.abweichungZurAuto;
            if (cur) return prev;
            return { ...prev, abweichungZurAuto: computedAbw };
        });
    }, [computedAbw]);

    const headerTitle = React.useMemo(() => {
        const t = String(value.type ?? "Meldung");
        const vNo = value.versionNo;
        return `${t} · v${vNo}`;
    }, [value]);

    React.useEffect(() => {
        if (typeof window === "undefined") return;
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        if (isDesktop) return;
        stepCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [activeStep]);

    const submitDisabled = disabled || statusIsDone || saving || (isCorrection && !String(changeReason ?? "").trim());

    const selectedAnlassCodes = React.useMemo(() => normalizeAnlassCodes(form.anlassCodes), [form.anlassCodes]);
    const selectedAnlassLabels = React.useMemo(() => selectedAnlassCodes.map(anlassLabel), [selectedAnlassCodes]);
    const [collapsedAnlassCategories, setCollapsedAnlassCategories] = React.useState<Record<string, boolean>>(() =>
        Object.fromEntries(ANLASS_CATALOG.map((cat) => [cat.key, false]))
    );
    const toggleAnlassCategory = React.useCallback((key: string) => {
        setCollapsedAnlassCategories((prev) => ({
            ...prev,
            [key]: !(prev?.[key] ?? false),
        }));
    }, []);
    const expandAllAnlassCategories = React.useCallback(() => {
        setCollapsedAnlassCategories(Object.fromEntries(ANLASS_CATALOG.map((cat) => [cat.key, false])));
    }, []);
    const collapseAllAnlassCategories = React.useCallback(() => {
        setCollapsedAnlassCategories(Object.fromEntries(ANLASS_CATALOG.map((cat) => [cat.key, true])));
    }, []);

    const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === activeStep);
    const canGoBack = stepIndex > 0;
    const canGoNext = stepIndex < WORKFLOW_STEPS.length - 1;

    const goToPrevStep = () => {
        if (!canGoBack) return;
        setActiveStep(WORKFLOW_STEPS[stepIndex - 1].key);
    };

    const goToNextStep = () => {
        if (!canGoNext) return;
        setActiveStep(WORKFLOW_STEPS[stepIndex + 1].key);
    };

    function getStepStatus(step: WorkflowStepKey): StepStatus {
        switch (step) {
            case "aufnahme":
                return String(form.kurzbeschreibung ?? "").trim() &&
                normalizeAnlassCodes(form.anlassCodes).length > 0 &&
                (form.observations ?? []).length > 0
                    ? "done"
                    : "open";
            case "einschaetzung":
                return String(form.fachAmpel ?? "").trim() ? "done" : "open";
            case "massnahmen":
                return (form.contacts ?? []).length > 0 || !!form.jugendamt ? "done" : "open";
            case "planung":
                return String(form.naechsteUeberpruefungAm ?? "").trim() ? "done" : "open";
            case "abschluss":
                return "open";
            default:
                return "open";
        }
    }

    const renderAnlassSection = () => {
        const selectedCodesSet = new Set(selectedAnlassCodes);
        return (
            <SectionCard title="Anlässe" description="Die Auswahl steuert die automatische Tag-Erstellung in den Beobachtungen.">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {selectedAnlassLabels.length ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedAnlassLabels.map((label) => (
                                <Badge key={label} tone="info">
                                    {label}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <div className="text-xs text-brand-text2">Noch keine Anlässe ausgewählt.</div>
                    )}
                    <div className="flex gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={expandAllAnlassCategories} disabled={disabled || statusIsDone}>
                            Alle öffnen
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={collapseAllAnlassCategories} disabled={disabled || statusIsDone}>
                            Alle schließen
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {ANLASS_CATALOG.map((cat) => {
                        const selectedCount = cat.items.filter((it) => selectedCodesSet.has(it.code)).length;
                        const collapsed = collapsedAnlassCategories[cat.key] ?? false;
                        return (
                            <div key={cat.key} className="rounded-2xl border border-brand-border/30 bg-white shadow-sm">
                                <button
                                    type="button"
                                    aria-expanded={!collapsed}
                                    onClick={() => toggleAnlassCategory(cat.key)}
                                    className="flex w-full items-center justify-between gap-4 rounded-2xl bg-brand-bg/40 px-4 py-3 text-left transition hover:bg-brand-bg/70"
                                    disabled={disabled || statusIsDone}
                                >
                                    <div className="text-base font-semibold text-brand-text">{cat.title}</div>
                                    <div className="flex items-center gap-3">
                                        <Badge tone={selectedCount ? "info" : "neutral"}>
                                            {selectedCount ? `${selectedCount} ausgewählt` : "Keine Auswahl"}
                                        </Badge>
                                        <ChevronDown
                                            className={["h-4 w-4 transition-transform", collapsed ? "-rotate-90" : "rotate-0"].join(" ")}
                                        />
                                    </div>
                                </button>

                                {!collapsed ? (
                                    <div className="grid grid-cols-1 gap-2 border-t border-brand-border/20 bg-white p-3 sm:grid-cols-2">
                                        {cat.items.map((it) => {
                                            const selected = selectedCodesSet.has(it.code);
                                            return (
                                                <button
                                                    key={it.code}
                                                    type="button"
                                                    onClick={() => toggleAnlass(it.code)}
                                                    disabled={disabled || statusIsDone}
                                                    className={[
                                                        "rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border",
                                                        selected
                                                            ? "border-brand-border bg-brand-bg/80 shadow-inner"
                                                            : "border-brand-border/25 bg-white hover:bg-brand-bg/40",
                                                    ].join(" ")}
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="text-sm font-semibold text-brand-text">{it.label}</div>
                                                        {selected ? <Badge tone="info">ausgewählt</Badge> : <Badge tone="neutral">—</Badge>}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="border-t border-dashed border-brand-border/20 px-4 py-3 text-xs text-brand-text2">
                                        Kategorie eingeklappt – zum Öffnen erneut klicken.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </SectionCard>
        );
    };

    const renderObservationSection = () => (
        <SectionCard title="Beobachtungen" description="Pro Beobachtung werden Tags automatisch aus den ausgewählten Anlässen erzeugt.">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-sm text-brand-text2">Fakten und Beobachtungen dokumentieren – bitte sachlich und überprüfbar.</div>
                <Button variant="secondary" className="h-11" onClick={addObservation} disabled={disabled || statusIsDone}>
                    Beobachtung hinzufügen
                </Button>
            </div>

            <div className="space-y-3">
                {(form.observations ?? []).length === 0 ? (
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">Noch keine Beobachtungen.</div>
                ) : null}

                {(form.observations ?? []).map((o, idx) => {
                    const tags = Array.isArray(o?.tags) ? o.tags : [];
                    const textPath = `observations.${idx}.text`;
                    const textChanged = isChanged(textPath);
                    const textPrev = previousValueOf(textPath);

                    return (
                        <div key={idx} className="rounded-2xl border border-brand-border/25 bg-white p-3 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="text-sm font-semibold text-brand-text">Beobachtung {idx + 1}</div>
                                <Button variant="secondary" className="h-10" onClick={() => removeObs(idx)} disabled={disabled || statusIsDone}>Entfernen</Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <FieldRow label="Zeitpunkt">
                                    <Input value={String(o.zeitpunkt ?? "")} onChange={(e) => updateObs(idx, { zeitpunkt: e.target.value })} disabled={disabled || statusIsDone} />
                                </FieldRow>

                                <FieldRow label="Zeitraum">
                                    <select
                                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                        value={pick(String(o.zeitraum ?? "EINMALIG"), OBS_ZEITRAUM, "EINMALIG")}
                                        onChange={(e) => updateObs(idx, { zeitraum: e.target.value })}
                                        disabled={disabled || statusIsDone}
                                    >
                                        {OBS_ZEITRAUM.map((x) => <option key={x} value={x}>{OBS_ZEITRAUM_LABEL[x]}</option>)}
                                    </select>
                                </FieldRow>

                                <FieldRow label="Ort">
                                    <select
                                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                        value={pick(String(o.ort ?? "SCHULE_KITA"), OBS_ORT, "SCHULE_KITA")}
                                        onChange={(e) => updateObs(idx, { ort: e.target.value })}
                                        disabled={disabled || statusIsDone}
                                    >
                                        {OBS_ORT.map((x) => <option key={x} value={x}>{OBS_ORT_LABEL[x]}</option>)}
                                    </select>
                                </FieldRow>

                                {String(o.ort ?? "") === "SONSTIGES" ? (
                                    <FieldRow label="Ort sonstiges">
                                        <Input value={String(o.ortSonstiges ?? "")} onChange={(e) => updateObs(idx, { ortSonstiges: e.target.value || null })} disabled={disabled || statusIsDone} />
                                    </FieldRow>
                                ) : null}

                                <FieldRow label="Quelle">
                                    <select
                                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                        value={pick(String(o.quelle ?? "UNBEKANNT"), OBS_QUELLE, "UNBEKANNT")}
                                        onChange={(e) => updateObs(idx, { quelle: e.target.value })}
                                        disabled={disabled || statusIsDone}
                                    >
                                        {OBS_QUELLE.map((x) => <option key={x} value={x}>{OBS_QUELLE_LABEL[x]}</option>)}
                                    </select>
                                </FieldRow>

                                <FieldRow label="Sichtbarkeit">
                                    <select
                                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                        value={pick(String(o.sichtbarkeit ?? "INTERN"), SICHT, "INTERN")}
                                        onChange={(e) => updateObs(idx, { sichtbarkeit: e.target.value })}
                                        disabled={disabled || statusIsDone}
                                    >
                                        {SICHT.map((x) => <option key={x} value={x}>{SICHT_LABEL[x]}</option>)}
                                    </select>
                                </FieldRow>

                                <FieldRow label="Beobachtungstext" changed={textChanged} previousValue={textPrev} labelClassName={changedLabelClass(textChanged)}>
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
                                    <Textarea rows={2} value={String(o.woertlichesZitat ?? "")} onChange={(e) => updateObs(idx, { woertlichesZitat: e.target.value || null })} disabled={disabled || statusIsDone} />
                                </FieldRow>

                                <FieldRow label="Körperbefund">
                                    <Textarea rows={2} value={String(o.koerperbefund ?? "")} onChange={(e) => updateObs(idx, { koerperbefund: e.target.value || null })} disabled={disabled || statusIsDone} />
                                </FieldRow>

                                <FieldRow label="Verhalten Kind">
                                    <Textarea rows={2} value={String(o.verhaltenKind ?? "")} onChange={(e) => updateObs(idx, { verhaltenKind: e.target.value || null })} disabled={disabled || statusIsDone} />
                                </FieldRow>

                                <FieldRow label="Verhalten Bezugsperson">
                                    <Textarea rows={2} value={String(o.verhaltenBezug ?? "")} onChange={(e) => updateObs(idx, { verhaltenBezug: e.target.value || null })} disabled={disabled || statusIsDone} />
                                </FieldRow>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-brand-text">Tags (automatisch aus Anlässen)</div>
                                <div className="grid grid-cols-1 gap-2">
                                    {tags.map((t, tagIdx) => {
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
                                                    <div className="text-sm font-semibold text-brand-text">{anlassLabel(code)}</div>
                                                    <Badge tone="neutral">Severity {clampSeverity(Number(t?.severity ?? 0))}</Badge>
                                                </div>

                                                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <FieldRow label="Severity (0–3)" changed={sevChanged} previousValue={sevPrev} labelClassName={changedLabelClass(sevChanged)}>
                                                        <select
                                                            className={`h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text ${changedInputClass(sevChanged)}`}
                                                            value={String(clampSeverity(Number(t?.severity ?? 0)))}
                                                            onChange={(e) => updateObsTag(idx, code, { severity: clampSeverity(Number(e.target.value)) })}
                                                            disabled={disabled || statusIsDone}
                                                            title={changeTooltip(sevChanged, sevPrev)}
                                                        >
                                                            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
                                                        </select>
                                                    </FieldRow>

                                                    <FieldRow label="Kommentar / Kontext" changed={comChanged} previousValue={comPrev} labelClassName={changedLabelClass(comChanged)}>
                                                        <Input
                                                            value={String(t?.comment ?? "")}
                                                            onChange={(e) => updateObsTag(idx, code, { comment: e.target.value })}
                                                            disabled={disabled || statusIsDone}
                                                            className={changedInputClass(comChanged)}
                                                        />
                                                    </FieldRow>

                                                    <FieldRow label="IndicatorId (optional)">
                                                        <Input value={String(t?.indicatorId ?? "")} onChange={(e) => updateObsTag(idx, code, { indicatorId: e.target.value || null })} disabled={disabled || statusIsDone} />
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
        </SectionCard>
    );

    const renderFachSection = () => (
        <SectionCard title="Fachbewertung" description="Gegenüberstellung von Auto-Ampel und fachlicher Einschätzung.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label="Fach-Ampel">
                    <select
                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                        value={form.fachAmpel ? pick(String(form.fachAmpel), AMPEL, "GRUEN") : ""}
                        onChange={(e) => set("fachAmpel", e.target.value || null)}
                        disabled={disabled || statusIsDone}
                    >
                        <option value="">—</option>
                        {AMPEL.map((x) => <option key={x} value={x}>{AMPEL_LABEL[x]}</option>)}
                    </select>
                </FieldRow>

                <FieldRow label="Abweichung zur Auto-Ampel">
                    <select
                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                        value={pick(String(form.abweichungZurAuto ?? "GLEICH"), ABW_AUTO, "GLEICH")}
                        onChange={(e) => set("abweichungZurAuto", e.target.value)}
                        disabled={disabled || statusIsDone}
                    >
                        {ABW_AUTO.map((x) => <option key={x} value={x}>{ABW_AUTO_LABEL[x]}</option>)}
                    </select>
                </FieldRow>

                <FieldRow label="Fachtext">
                    <Textarea rows={5} value={String(form.fachText ?? "")} onChange={(e) => set("fachText", e.target.value || null)} disabled={disabled || statusIsDone} />
                </FieldRow>

                <FieldRow label="Begründung (falls abweichend)">
                    <Textarea rows={4} value={String(form.abweichungsBegruendung ?? "")} onChange={(e) => set("abweichungsBegruendung", e.target.value || null)} disabled={disabled || statusIsDone} />
                </FieldRow>
            </div>
        </SectionCard>
    );

    const renderAkutSection = () => (
        <SectionCard title="Akutlage & Jugendamt" description="Sofortschutz, Gefahr im Verzug und Jugendamt-Kontakt dokumentieren.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`rounded-2xl border bg-white p-3 ${isChanged("akutGefahrImVerzug") ? "border-red-300 bg-red-50/40" : "border-brand-border/25"}`}>
                    <div className="flex items-center justify-between">
                        <div className={`text-sm font-semibold ${isChanged("akutGefahrImVerzug") ? "text-red-700" : "text-brand-text"}`}>Gefahr im Verzug</div>
                        <Switch checked={!!form.akutGefahrImVerzug} onCheckedChange={(v) => set("akutGefahrImVerzug", v)} disabled={disabled || statusIsDone} />
                    </div>
                    <div className="mt-2 text-xs text-brand-text2">Nur setzen, wenn eine sofortige Intervention erforderlich ist.</div>
                </div>

                <FieldRow label="Notruf erforderlich">
                    <select
                        className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                        value={String(form.akutNotrufErforderlich ?? "")}
                        onChange={(e) => set("akutNotrufErforderlich", e.target.value === "" ? null : e.target.value === "true")}
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
                        value={pick(String(form.akutKindSicherUntergebracht ?? "UNKLAR"), JANEINUNKLAR, "UNKLAR")}
                        onChange={(e) => set("akutKindSicherUntergebracht", e.target.value)}
                        disabled={disabled || statusIsDone}
                    >
                        {JANEINUNKLAR.map((x) => <option key={x} value={x}>{JNU_LABEL[x]}</option>)}
                    </select>
                </FieldRow>

                <FieldRow label="Begründung / Maßnahmen (Akut)">
                    <Textarea rows={5} value={String(form.akutBegruendung ?? "")} onChange={(e) => set("akutBegruendung", e.target.value || null)} disabled={disabled || statusIsDone} />
                </FieldRow>
            </div>

            <Separator />

            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-brand-text">
                        <Building2 className="h-4 w-4 text-brand-text2" />
                        Jugendamt
                    </div>
                    {form.jugendamt ? (
                        <Button variant="secondary" className="h-10" onClick={clearJugendamt} disabled={disabled || statusIsDone}>Jugendamt-Block entfernen</Button>
                    ) : (
                        <Button variant="secondary" className="h-10" onClick={ensureJugendamt} disabled={disabled || statusIsDone}>Jugendamt erfassen</Button>
                    )}
                </div>

                {form.jugendamt ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-brand-border/25 bg-white p-3">
                        <FieldRow label="Jugendamt informiert">
                            <select
                                className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                value={pick(String(form.jugendamt?.informiert ?? "UNKLAR"), JANEINUNKLAR, "UNKLAR")}
                                onChange={(e) => setJugendamt({ informiert: e.target.value })}
                                disabled={disabled || statusIsDone}
                            >
                                {JANEINUNKLAR.map((x) => <option key={x} value={x}>{JNU_LABEL[x]}</option>)}
                            </select>
                        </FieldRow>

                        <FieldRow label="Kontakt am">
                            <Input value={String(form.jugendamt?.kontaktAm ?? "")} onChange={(e) => setJugendamt({ kontaktAm: e.target.value || null })} disabled={disabled || statusIsDone} placeholder={nowIso()} />
                        </FieldRow>

                        <FieldRow label="Kontaktart">
                            <select
                                className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                value={String(form.jugendamt?.kontaktart ?? "")}
                                onChange={(e) => setJugendamt({ kontaktart: e.target.value || null })}
                                disabled={disabled || statusIsDone}
                            >
                                <option value="">—</option>
                                {KONTAKTART.map((x) => <option key={x} value={x}>{KONTAKTART_LABEL[x]}</option>)}
                            </select>
                        </FieldRow>

                        <FieldRow label="Aktenzeichen">
                            <Input value={String(form.jugendamt?.aktenzeichen ?? "")} onChange={(e) => setJugendamt({ aktenzeichen: e.target.value || null })} disabled={disabled || statusIsDone} />
                        </FieldRow>

                        <FieldRow label="Begründung">
                            <Textarea rows={4} value={String(form.jugendamt?.begruendung ?? "")} onChange={(e) => setJugendamt({ begruendung: e.target.value || null })} disabled={disabled || statusIsDone} />
                        </FieldRow>
                    </div>
                ) : null}
            </div>
        </SectionCard>
    );

    const renderContactsSection = () => (
        <SectionCard title="Kontakte & Verlauf" description="Gesprächs-, Kontakt- und Erreichbarkeitsverlauf dokumentieren.">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                <div className="text-sm text-brand-text2">Verlauf nachvollziehbar halten.</div>
                <Button variant="secondary" className="h-11" onClick={addContact} disabled={disabled || statusIsDone}>Kontakt hinzufügen</Button>
            </div>

            <div className="space-y-3">
                {(form.contacts ?? []).length === 0 ? (
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">Noch keine Kontakte erfasst.</div>
                ) : null}

                {(form.contacts ?? []).map((c, idx) => (
                    <div key={idx} className="rounded-2xl border border-brand-border/25 bg-white p-3 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="text-sm font-semibold text-brand-text">Kontakt {idx + 1}</div>
                            <Button variant="secondary" className="h-10" onClick={() => removeContact(idx)} disabled={disabled || statusIsDone}>Entfernen</Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FieldRow label="Kontakt mit">
                                <select
                                    className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                    value={pick(String(c.kontaktMit ?? "SONSTIGE"), KONTAKT_MIT, "SONSTIGE")}
                                    onChange={(e) => updateContact(idx, { kontaktMit: e.target.value })}
                                    disabled={disabled || statusIsDone}
                                >
                                    {KONTAKT_MIT.map((x) => <option key={x} value={x}>{KONTAKT_MIT_LABEL[x]}</option>)}
                                </select>
                            </FieldRow>

                            <FieldRow label="Kontakt am">
                                <Input value={String(c.kontaktAm ?? "")} onChange={(e) => updateContact(idx, { kontaktAm: e.target.value || null })} disabled={disabled || statusIsDone} placeholder={nowIso()} />
                            </FieldRow>

                            <FieldRow label="Status">
                                <select
                                    className="h-10 w-full rounded-2xl border border-brand-border/40 bg-white px-3 text-sm text-brand-text"
                                    value={pick(String(c.status ?? "GEPLANT"), KONTAKT_STATUS, "GEPLANT")}
                                    onChange={(e) => updateContact(idx, { status: e.target.value })}
                                    disabled={disabled || statusIsDone}
                                >
                                    {KONTAKT_STATUS.map((x) => <option key={x} value={x}>{KONTAKT_STATUS_LABEL[x]}</option>)}
                                </select>
                            </FieldRow>

                            <FieldRow label="Ergebnis">
                                <Input value={String(c.ergebnis ?? "")} onChange={(e) => updateContact(idx, { ergebnis: e.target.value || null })} disabled={disabled || statusIsDone} />
                            </FieldRow>

                            <FieldRow label="Notiz">
                                <Textarea rows={3} value={String(c.notiz ?? "")} onChange={(e) => updateContact(idx, { notiz: e.target.value || null })} disabled={disabled || statusIsDone} />
                            </FieldRow>
                        </div>
                    </div>
                ))}
            </div>
        </SectionCard>
    );

    const renderPlanningSection = () => (
        <SectionCard title="Planung" description="Verantwortlichkeiten, Review-Termin und Zusammenfassung.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldRow label="Verantwortliche Fachkraft (UserId)">
                    <Input value={String(form.verantwortlicheFachkraftUserId ?? "")} onChange={(e) => set("verantwortlicheFachkraftUserId", e.target.value ? Number(e.target.value) : null)} disabled={disabled || statusIsDone} />
                </FieldRow>

                <FieldRow label="Nächste Überprüfung am *" hint="Pflichtfeld – Datum im Format JJJJ-MM-TT">
                    <Input type="date" value={String(form.naechsteUeberpruefungAm ?? "")} onChange={(e) => set("naechsteUeberpruefungAm", e.target.value || null)} disabled={disabled || statusIsDone} />
                </FieldRow>

                <FieldRow label="Zusammenfassung">
                    <Textarea rows={4} value={String(form.zusammenfassung ?? "")} onChange={(e) => set("zusammenfassung", e.target.value || null)} disabled={disabled || statusIsDone} />
                </FieldRow>
            </div>
        </SectionCard>
    );

    const renderFinalSection = () => (
        <SectionCard title="Speichern & Abschluss" description="Ein gemeinsamer Abschluss für Meldung und Begleitbögen.">
            <div className="rounded-2xl border border-brand-border/25 bg-white p-3 space-y-2">
                <div className="text-sm font-semibold text-brand-text">Notizen spiegeln</div>
                <div className="text-sm text-brand-text2">Optional: Abschluss in die Notizen übernehmen.</div>
                <div className="flex items-center justify-between rounded-2xl border border-brand-border/25 p-3">
                    <div className="text-sm text-brand-text">Beim Abschließen spiegeln</div>
                    <Switch checked={submitMirror} onCheckedChange={(v) => setSubmitMirror(v)} disabled={disabled || statusIsDone} />
                </div>
            </div>

            {isCorrection ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 space-y-2">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 text-red-600" />
                        <div className="min-w-0">
                            <div className="text-sm font-semibold text-red-700">Korrektur: Änderungsgrund erforderlich</div>
                            <div className="text-sm text-red-700/90">Für Korrekturen muss dokumentiert werden, was geändert wurde und warum.</div>
                        </div>
                    </div>

                    <FieldRow label="Änderungsgrund (Pflicht)" labelClassName="text-red-700" changed={!!String(changeReason ?? "").trim()} previousValue="">
                        <Textarea
                            rows={4}
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                            disabled={disabled || statusIsDone}
                            className="border-red-300 bg-red-50/40 focus-visible:ring-red-300"
                            placeholder="z.B. neue Information nach Rückruf / Datenabgleich / falsche Angabe korrigiert …"
                        />
                    </FieldRow>
                </div>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-2">
                <Button
                    variant="secondary"
                    className="touch-target w-full rounded-full gap-2 text-base font-semibold sm:w-auto min-h-[52px] px-5"
                    onClick={doSave}
                    disabled={disabled || statusIsDone || saving}
                >
                    <Save className="h-5 w-5" />
                    Entwurf speichern
                </Button>
                <Button
                    className="touch-target w-full rounded-full gap-2 text-base font-semibold sm:w-auto min-h-[52px] px-5"
                    onClick={doSubmit}
                    disabled={submitDisabled}
                >
                    <CheckCircle2 className="h-5 w-5" />
                    Abschließen
                </Button>
            </div>

            <div className="text-xs text-brand-text2">
                Hinweis: Save und Submit verwenden denselben Persistenzpfad. Der Unterschied ist nur der finale Submit der Meldung.
            </div>
        </SectionCard>
    );

    const stepContent = (() => {
        switch (activeStep) {
            case "aufnahme":
                return (
                    <div className="space-y-4">
                        <MeldungBasisSection
                            form={form}
                            melderInfo={melderInfo}
                            disabled={disabled}
                            statusIsDone={statusIsDone}
                            setField={set}
                            setMelderInfo={setMelderInfo}
                            isChanged={isChanged}
                            previousValueOf={previousValueOf}
                        />
                        {renderAnlassSection()}
                        {renderObservationSection()}
                    </div>
                );
            case "einschaetzung":
                return (
                    <div className="space-y-4">
                        {renderFachSection()}
                        {COMPANION_BOGEN_PLUGINS.filter((p) => p.step === "einschaetzung").map((plugin) => {
                            const slot = pluginSlots[plugin.key];
                            if (!slot) return null;
                            return (
                                <PageCard key={plugin.key} title={plugin.label} icon={plugin.icon}>
                                    {plugin.render({
                                        state: slot.state,
                                        onChange: (next) =>
                                            setPluginSlots((prev) => ({
                                                ...prev,
                                                [plugin.key]: { ...prev[plugin.key], state: next },
                                            })),
                                        disabled: disabled || statusIsDone,
                                    })}
                                </PageCard>
                            );
                        })}
                    </div>
                );
            case "massnahmen":
                return (
                    <div className="space-y-4">
                        {renderAkutSection()}
                        {renderContactsSection()}
                        {COMPANION_BOGEN_PLUGINS.filter((p) => p.step === "massnahmen").map((plugin) => {
                            const slot = pluginSlots[plugin.key];
                            if (!slot) return null;
                            return (
                                <PageCard key={plugin.key} title={plugin.label} icon={plugin.icon}>
                                    {plugin.render({
                                        state: slot.state,
                                        onChange: (next) =>
                                            setPluginSlots((prev) => ({
                                                ...prev,
                                                [plugin.key]: { ...prev[plugin.key], state: next },
                                            })),
                                        disabled: disabled || statusIsDone,
                                    })}
                                </PageCard>
                            );
                        })}
                    </div>
                );
            case "planung":
                return <div className="space-y-4">{renderPlanningSection()}</div>;
            case "abschluss":
                return <div className="space-y-4">{renderFinalSection()}</div>;
            default:
                return null;
        }
    })();

    return (
        <div className="space-y-5 px-3 pb-24 pt-4 sm:px-4 lg:px-8">
            <div className="rounded-3xl border border-brand-border/30 bg-white p-4 sm:p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                        <div className="text-lg font-semibold text-brand-text flex flex-wrap items-center gap-2">
                            <FileText className="h-5 w-5 text-brand-text2" />
                            <span className="truncate">{headerTitle}</span>
                            {isCorrection ? <Badge tone="warning">Korrektur</Badge> : null}
                            {statusIsDone ? <Badge tone="success">abgeschlossen</Badge> : <Badge tone="info">Entwurf</Badge>}
                        </div>
                        <div className="text-sm text-brand-text2">§8a-konforme Dokumentation als durchgehender Workflow.</div>
                        {isCorrection ? (
                            <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>Dies ist eine <span className="font-semibold">Korrektur</span>. Geänderte Felder sind rot markiert.</span>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap lg:w-auto">
                        <Button
                            variant="secondary"
                            className="touch-target w-full rounded-full gap-2 text-base font-semibold sm:w-auto min-h-[52px] px-5"
                            onClick={doSave}
                            disabled={disabled || statusIsDone || saving}
                        >
                            <Save className="h-5 w-5" />
                            Entwurf speichern
                        </Button>
                        <Button
                            className="touch-target w-full rounded-full gap-2 text-base font-semibold sm:w-auto min-h-[52px] px-5"
                            onClick={doSubmit}
                            disabled={submitDisabled}
                        >
                            <CheckCircle2 className="h-5 w-5" />
                            Abschließen
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-brand-border/25 bg-brand-bg p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">Auto-Ampel</div>
                        <div className="mt-1 text-base font-semibold text-brand-text">{AMPEL_LABEL[pick(auto.autoAmpel, AMPEL, "GRUEN")]}</div>
                        <div className="mt-1 text-xs text-brand-text2 leading-relaxed">{auto.rationale}</div>
                    </div>
                    <div className="rounded-2xl border border-brand-border/25 bg-brand-bg p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">Fach-Ampel</div>
                        <div className="mt-1 text-base font-semibold text-brand-text">{fachAmpel ? AMPEL_LABEL[pick(fachAmpel, AMPEL, "GRUEN")] : "—"}</div>
                        <div className="mt-1 text-xs text-brand-text2">Abweichung: {ABW_AUTO_LABEL[pick(form.abweichungZurAuto ?? "GLEICH", ABW_AUTO, "GLEICH")]}</div>
                    </div>
                    <div className="rounded-2xl border border-brand-border/25 bg-brand-bg p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">Prozess</div>
                        <div className="mt-1 text-base font-semibold text-brand-text">{WORKFLOW_STEPS[stepIndex]?.label}</div>
                        <div className="mt-1 text-xs text-brand-text2">{WORKFLOW_STEPS[stepIndex]?.subtitle}</div>
                    </div>
                </div>
            </div>

            {validationErr ? (
                <Alert variant="destructive">
                    <AlertTitle>Bitte prüfen</AlertTitle>
                    <AlertDescription>{validationErr}</AlertDescription>
                </Alert>
            ) : null}

            {submitErr ? <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm text-brand-danger">{submitErr}</div> : null}
            {saveMsg ? <div className="rounded-2xl border border-brand-border/30 bg-white p-4 text-sm text-brand-text">{saveMsg}</div> : null}

            <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
                <div className="space-y-4 lg:sticky lg:top-[calc(env(safe-area-inset-top,1rem)+16px)] lg:h-full">
                    <PageCard title="Workflow" icon={<Layers3 className="h-4 w-4 text-brand-text2" />} description="Die Meldung wird als zusammenhängender Prozess bearbeitet.">
                        <div className="space-y-2 max-h-[calc(100vh-240px)] overflow-y-auto pr-1 lg:pr-2">
                            {WORKFLOW_STEPS.map((step) => {
                                const isActive = step.key === activeStep;
                                const status = getStepStatus(step.key);
                                return (
                                    <button
                                        key={step.key}
                                        type="button"
                                        onClick={() => setActiveStep(step.key)}
                                        className={`w-full rounded-2xl border px-4 py-3 min-h-[56px] text-left text-base font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30 ${
                                            isActive ? "border-brand-border/60 bg-brand-bg" : "border-brand-border/25 bg-white hover:bg-brand-bg/40"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-brand-text">{step.label}</div>
                                                <div className="mt-1 text-xs text-brand-text2">{step.subtitle}</div>
                                            </div>
                                            <StepBadge status={status} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </PageCard>

                    <PageCard title="Persistenz" icon={<ListChecks className="h-4 w-4 text-brand-text2" />}>
                        <div className="text-sm text-brand-text2">Beim Speichern werden gemeinsam geschrieben:</div>
                        <div className="flex flex-wrap gap-2">
                            <Badge tone="info">Meldung</Badge>
                            <Badge tone="info">Meldebogen</Badge>
                            <Badge tone="info">Kinderschutzbogen</Badge>
                            <Badge tone="info">DJI Sicherheit</Badge>
                            <Badge tone="info">DJI Risiko</Badge>
                            <Badge tone="info">Schutzplan</Badge>
                            {COMPANION_BOGEN_PLUGINS.find((p) => p.key === "hausbesuch")?.isEnabled?.({
                                mainForm: form,
                                state: pluginSlots["hausbesuch"]?.state,
                            }) ? <Badge tone="info">Hausbesuch</Badge> : null}
                        </div>
                    </PageCard>
                </div>

                <div className="space-y-4" ref={stepCardRef}>
                    <PageCard
                        title={WORKFLOW_STEPS[stepIndex]?.label ?? "Schritt"}
                        icon={<ClipboardCheck className="h-4 w-4 text-brand-text2" />}
                        description={WORKFLOW_STEPS[stepIndex]?.subtitle}
                    >
                        {stepContent}
                    </PageCard>

                    <div className="rounded-3xl border border-brand-border/30 bg-white p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-brand-text2">
                            Navigation durch den Prozess. Du kannst jederzeit speichern, ohne Datenstände zu verlieren.
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                                variant="secondary"
                                className="touch-target rounded-full gap-2 min-h-[48px] px-4 text-base font-semibold"
                                onClick={goToPrevStep}
                                disabled={!canGoBack}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Zurück
                            </Button>
                            <Button
                                variant="secondary"
                                className="touch-target rounded-full gap-2 min-h-[48px] px-4 text-base font-semibold"
                                onClick={goToNextStep}
                                disabled={!canGoNext}
                            >
                                Weiter
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MeldungEditor;