"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    meldebogenApi,
    type MeldebogenResponse,
    type MeldebogenRequest,
    MELDUNGART_LABELS,
    ERSTEINSCHAETZUNG_LABELS,
    ERSTEINSCHAETZUNG_TONE,
    DRINGLICHKEIT_LABELS,
    GLAUBWUERDIGKEIT_LABELS,
} from "@/lib/api/meldebogen";
import { ArrowLeft, Edit2, FileSearch, Check } from "lucide-react";
import { toast } from "sonner";

const INPUT_CLASS =
    "w-full rounded-xl border border-brand-border/40 bg-white px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30";
const LABEL_CLASS = "block text-xs font-medium text-brand-text2 mb-1";

function btnClass(active: boolean) {
    return `rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
        active
            ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
    }`;
}

function ersteinschaetzungBtnClass(key: string, active: boolean) {
    if (!active) {
        return "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40";
    }
    const tone = ERSTEINSCHAETZUNG_TONE[key] ?? "text-brand-primary";
    return `rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors border-current bg-current/10 ${tone}`;
}

interface FormState {
    eingangsdatum: string;
    erfassendeFachkraft: string;
    meldungart: string;
    melderName: string;
    melderKontakt: string;
    melderBeziehungKind: string;
    melderGlaubwuerdigkeit: string;
    schilderung: string;
    kindAktuellerAufenthalt: string;
    belastungKoerperlErkrankung: boolean;
    belastungPsychErkrankung: boolean;
    belastungSucht: boolean;
    belastungHaeuslicheGewalt: boolean;
    belastungSuizidgefahr: boolean;
    belastungGewalttaetigeErz: boolean;
    belastungSozialeIsolation: boolean;
    belastungSonstiges: string;
    ersteinschaetzung: string;
    handlungsdringlichkeit: string;
    ersteinschaetzungFreitext: string;
}

function responseToForm(r: MeldebogenResponse): FormState {
    return {
        eingangsdatum: r.eingangsdatum,
        erfassendeFachkraft: r.erfassendeFachkraft ?? "",
        meldungart: r.meldungart ?? "",
        melderName: r.melderName ?? "",
        melderKontakt: r.melderKontakt ?? "",
        melderBeziehungKind: r.melderBeziehungKind ?? "",
        melderGlaubwuerdigkeit: r.melderGlaubwuerdigkeit ?? "",
        schilderung: r.schilderung ?? "",
        kindAktuellerAufenthalt: r.kindAktuellerAufenthalt ?? "",
        belastungKoerperlErkrankung: r.belastungKoerperlErkrankung,
        belastungPsychErkrankung: r.belastungPsychErkrankung,
        belastungSucht: r.belastungSucht,
        belastungHaeuslicheGewalt: r.belastungHaeuslicheGewalt,
        belastungSuizidgefahr: r.belastungSuizidgefahr,
        belastungGewalttaetigeErz: r.belastungGewalttaetigeErz,
        belastungSozialeIsolation: r.belastungSozialeIsolation,
        belastungSonstiges: r.belastungSonstiges ?? "",
        ersteinschaetzung: r.ersteinschaetzung ?? "",
        handlungsdringlichkeit: r.handlungsdringlichkeit ?? "",
        ersteinschaetzungFreitext: r.ersteinschaetzungFreitext ?? "",
    };
}

const belastungCheckboxes: { key: keyof FormState; label: string }[] = [
    { key: "belastungKoerperlErkrankung", label: "Körperliche Erkrankung" },
    { key: "belastungPsychErkrankung", label: "Psychische Erkrankung" },
    { key: "belastungSucht", label: "Suchtproblematik" },
    { key: "belastungHaeuslicheGewalt", label: "Häusliche Gewalt" },
    { key: "belastungSuizidgefahr", label: "Suizidgefahr" },
    { key: "belastungGewalttaetigeErz", label: "Gewalttätige Erziehungsmethoden" },
    { key: "belastungSozialeIsolation", label: "Soziale Isolation" },
];

export default function MeldebogenDetailPage() {
    const { akteId, fallId, meldebogenId } = useParams<{
        akteId: string;
        fallId: string;
        meldebogenId: string;
    }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;
    const mid = meldebogenId ? Number(meldebogenId) : null;

    const [data, setData]       = useState<MeldebogenResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState<FormState | null>(null);
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        if (!fid || !mid) return;
        setLoading(true);
        meldebogenApi
            .get(fid, mid)
            .then((r) => {
                setData(r);
                setForm(responseToForm(r));
            })
            .catch(() => setErr("Meldebogen konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid, mid]);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    }

    function toggleField(key: keyof FormState, currentValue: string, newValue: string) {
        setForm((prev) => {
            if (!prev) return prev;
            return { ...prev, [key]: prev[key] === newValue ? "" : newValue };
        });
        void currentValue;
    }

    async function handleSave() {
        if (!fid || !mid || !form) return;
        setSaving(true);
        try {
            const req: MeldebogenRequest = {
                eingangsdatum: form.eingangsdatum,
                erfassendeFachkraft: form.erfassendeFachkraft || null,
                meldungart: form.meldungart || null,
                melderName: form.melderName || null,
                melderKontakt: form.melderKontakt || null,
                melderBeziehungKind: form.melderBeziehungKind || null,
                melderGlaubwuerdigkeit: form.melderGlaubwuerdigkeit || null,
                schilderung: form.schilderung || null,
                kindAktuellerAufenthalt: form.kindAktuellerAufenthalt || null,
                belastungKoerperlErkrankung: form.belastungKoerperlErkrankung,
                belastungPsychErkrankung: form.belastungPsychErkrankung,
                belastungSucht: form.belastungSucht,
                belastungHaeuslicheGewalt: form.belastungHaeuslicheGewalt,
                belastungSuizidgefahr: form.belastungSuizidgefahr,
                belastungGewalttaetigeErz: form.belastungGewalttaetigeErz,
                belastungSozialeIsolation: form.belastungSozialeIsolation,
                belastungSonstiges: form.belastungSonstiges || null,
                ersteinschaetzung: form.ersteinschaetzung || null,
                handlungsdringlichkeit: form.handlungsdringlichkeit || null,
                ersteinschaetzungFreitext: form.ersteinschaetzungFreitext || null,
            };
            const updated = await meldebogenApi.update(fid, mid, req);
            setData(updated);
            setForm(responseToForm(updated));
            setEditing(false);
            toast.success("Meldebogen gespeichert.");
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="Meldebogen" />
                    <div className="p-8 text-center text-sm text-brand-text2">Lade…</div>
                </div>
            </AuthGate>
        );
    }

    if (err || !data || !form) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="Meldebogen" />
                    <div className="p-6 text-sm text-brand-danger">{err ?? "Nicht gefunden."}</div>
                </div>
            </AuthGate>
        );
    }

    const ersteinschaetzungLabel = data.ersteinschaetzung
        ? (ERSTEINSCHAETZUNG_LABELS[data.ersteinschaetzung] ?? data.ersteinschaetzung)
        : null;
    const ersteinschaetzungTone = data.ersteinschaetzung
        ? (ERSTEINSCHAETZUNG_TONE[data.ersteinschaetzung] ?? "text-brand-text2")
        : "text-brand-text2";

    const activeBelastedItems = belastungCheckboxes.filter(
        ({ key }) => data[key as keyof MeldebogenResponse] === true
    );

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Meldebogen" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() =>
                                router.push(`/dashboard/akten/${akteId}/${fid}/meldeboegen`)
                            }
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Übersicht
                        </Button>
                        {!editing && (
                            <Button
                                variant="outline"
                                className="gap-2"
                                onClick={() => setEditing(true)}
                            >
                                <Edit2 className="h-4 w-4" />
                                Bearbeiten
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 px-1">
                        <FileSearch className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                Meldebogen vom{" "}
                                {new Date(data.eingangsdatum).toLocaleDateString("de-DE")}
                            </div>
                            <div className="text-xs text-brand-text2">
                                Erstellt von {data.createdByDisplayName} ·{" "}
                                {new Date(data.createdAt).toLocaleDateString("de-DE")}
                            </div>
                        </div>
                    </div>

                    {editing ? (
                        /* ─── EDIT MODE ─── */
                        <>
                            {/* Eingang */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Eingang</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Eingangsdatum</label>
                                        <input
                                            type="date"
                                            value={form.eingangsdatum}
                                            onChange={(e) => setField("eingangsdatum", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Erfassende Fachkraft</label>
                                        <input
                                            type="text"
                                            value={form.erfassendeFachkraft}
                                            onChange={(e) => setField("erfassendeFachkraft", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Melder */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Melder</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Meldungsart</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(MELDUNGART_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("meldungart", form.meldungart, key)}
                                                    className={btnClass(form.meldungart === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {form.meldungart !== "ANONYM" && (
                                        <div>
                                            <label className={LABEL_CLASS}>Name des Melders</label>
                                            <input
                                                type="text"
                                                value={form.melderName}
                                                onChange={(e) => setField("melderName", e.target.value)}
                                                className={INPUT_CLASS}
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label className={LABEL_CLASS}>Kontakt</label>
                                        <input
                                            type="text"
                                            value={form.melderKontakt}
                                            onChange={(e) => setField("melderKontakt", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Beziehung zum Kind</label>
                                        <input
                                            type="text"
                                            value={form.melderBeziehungKind}
                                            onChange={(e) => setField("melderBeziehungKind", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Glaubwürdigkeit</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(GLAUBWUERDIGKEIT_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("melderGlaubwuerdigkeit", form.melderGlaubwuerdigkeit, key)}
                                                    className={btnClass(form.melderGlaubwuerdigkeit === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Schilderung */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Schilderung</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Schilderung</label>
                                        <Textarea
                                            value={form.schilderung}
                                            onChange={(e) => setField("schilderung", e.target.value)}
                                            rows={6}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Aktueller Aufenthaltsort des Kindes</label>
                                        <input
                                            type="text"
                                            value={form.kindAktuellerAufenthalt}
                                            onChange={(e) => setField("kindAktuellerAufenthalt", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Belastungsmerkmale */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Belastungsmerkmale der Sorgeberechtigten
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {belastungCheckboxes.map(({ key, label }) => (
                                        <label
                                            key={key}
                                            className="flex items-center gap-3 cursor-pointer rounded-xl border border-brand-border/30 bg-white px-3 py-2 hover:border-brand-primary/30 transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={form[key] as boolean}
                                                onChange={(e) => setField(key, e.target.checked as FormState[typeof key])}
                                                className="h-4 w-4 rounded border-brand-border text-brand-primary focus:ring-brand-primary/30"
                                            />
                                            <span className="text-sm text-brand-text">{label}</span>
                                        </label>
                                    ))}
                                    <div>
                                        <label className={LABEL_CLASS}>Sonstige Belastungen</label>
                                        <Textarea
                                            value={form.belastungSonstiges}
                                            onChange={(e) => setField("belastungSonstiges", e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Ersteinschätzung */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Ersteinschätzung</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Ersteinschätzung</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(ERSTEINSCHAETZUNG_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("ersteinschaetzung", form.ersteinschaetzung, key)}
                                                    className={ersteinschaetzungBtnClass(key, form.ersteinschaetzung === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Handlungsdringlichkeit</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(DRINGLICHKEIT_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("handlungsdringlichkeit", form.handlungsdringlichkeit, key)}
                                                    className={btnClass(form.handlungsdringlichkeit === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Begründung / Fachliche Einschätzung</label>
                                        <Textarea
                                            value={form.ersteinschaetzungFreitext}
                                            onChange={(e) => setField("ersteinschaetzungFreitext", e.target.value)}
                                            rows={4}
                                            className="text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setForm(responseToForm(data));
                                        setEditing(false);
                                    }}
                                >
                                    Abbrechen
                                </Button>
                                <Button onClick={handleSave} disabled={saving} className="gap-2">
                                    {saving ? "Wird gespeichert…" : "Speichern"}
                                </Button>
                            </div>
                        </>
                    ) : (
                        /* ─── VIEW MODE ─── */
                        <>
                            {/* Eingang */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Eingang</div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <ViewRow label="Eingangsdatum">
                                        {new Date(data.eingangsdatum).toLocaleDateString("de-DE")}
                                    </ViewRow>
                                    {data.erfassendeFachkraft && (
                                        <ViewRow label="Erfassende Fachkraft">
                                            {data.erfassendeFachkraft}
                                        </ViewRow>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Melder */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Melder</div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {data.meldungart && (
                                        <ViewRow label="Meldungsart">
                                            {MELDUNGART_LABELS[data.meldungart] ?? data.meldungart}
                                        </ViewRow>
                                    )}
                                    {data.melderName && (
                                        <ViewRow label="Name">{data.melderName}</ViewRow>
                                    )}
                                    {data.melderKontakt && (
                                        <ViewRow label="Kontakt">{data.melderKontakt}</ViewRow>
                                    )}
                                    {data.melderBeziehungKind && (
                                        <ViewRow label="Beziehung zum Kind">{data.melderBeziehungKind}</ViewRow>
                                    )}
                                    {data.melderGlaubwuerdigkeit && (
                                        <ViewRow label="Glaubwürdigkeit">
                                            {GLAUBWUERDIGKEIT_LABELS[data.melderGlaubwuerdigkeit] ?? data.melderGlaubwuerdigkeit}
                                        </ViewRow>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Schilderung */}
                            {(data.schilderung || data.kindAktuellerAufenthalt) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">Schilderung</div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {data.schilderung && (
                                            <div>
                                                <div className={LABEL_CLASS}>Schilderung</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.schilderung}
                                                </p>
                                            </div>
                                        )}
                                        {data.kindAktuellerAufenthalt && (
                                            <ViewRow label="Aktueller Aufenthaltsort des Kindes">
                                                {data.kindAktuellerAufenthalt}
                                            </ViewRow>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Belastungsmerkmale */}
                            {(activeBelastedItems.length > 0 || data.belastungSonstiges) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Belastungsmerkmale der Sorgeberechtigten
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {activeBelastedItems.map(({ label }) => (
                                            <div key={label} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-brand-primary flex-shrink-0" />
                                                <span className="text-sm text-brand-text">{label}</span>
                                            </div>
                                        ))}
                                        {data.belastungSonstiges && (
                                            <div className="mt-2">
                                                <div className={LABEL_CLASS}>Sonstige Belastungen</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.belastungSonstiges}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Ersteinschätzung */}
                            {(data.ersteinschaetzung || data.handlungsdringlichkeit || data.ersteinschaetzungFreitext) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">Ersteinschätzung</div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {ersteinschaetzungLabel && (
                                            <ViewRow label="Ersteinschätzung">
                                                <span className={`font-semibold ${ersteinschaetzungTone}`}>
                                                    {ersteinschaetzungLabel}
                                                </span>
                                            </ViewRow>
                                        )}
                                        {data.handlungsdringlichkeit && (
                                            <ViewRow label="Handlungsdringlichkeit">
                                                {DRINGLICHKEIT_LABELS[data.handlungsdringlichkeit] ?? data.handlungsdringlichkeit}
                                            </ViewRow>
                                        )}
                                        {data.ersteinschaetzungFreitext && (
                                            <div>
                                                <div className={LABEL_CLASS}>Begründung / Fachliche Einschätzung</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.ersteinschaetzungFreitext}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthGate>
    );
}

function ViewRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="text-xs font-medium text-brand-text2 mb-0.5">{label}</div>
            <div className="text-sm text-brand-text">{children}</div>
        </div>
    );
}
