"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    schutzplanApi,
    type SchutzplanResponse,
    type SchutzplanRequest,
    type MassnahmeRequest,
    SCHUTZPLAN_STATUS_LABELS,
    MASSNAHME_STATUS_LABELS,
    MASSNAHME_STATUS_TONE,
} from "@/lib/api/schutzplan";
import { ArrowLeft, Edit2, Plus, Trash2, ShieldCheck } from "lucide-react";
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

interface MassnahmeState {
    massnahme: string;
    verantwortlich: string;
    bisDatum: string;
    status: string;
}

interface FormState {
    erstelltAm: string;
    gueltigBis: string;
    status: string;
    gefaehrdungssituation: string;
    vereinbarungen: string;
    beteiligte: string;
    naechsterTermin: string;
    gesamtfreitext: string;
    massnahmen: MassnahmeState[];
}

function emptyMassnahme(): MassnahmeState {
    return { massnahme: "", verantwortlich: "", bisDatum: "", status: "OFFEN" };
}

function responseToForm(r: SchutzplanResponse): FormState {
    return {
        erstelltAm: r.erstelltAm,
        gueltigBis: r.gueltigBis ?? "",
        status: r.status,
        gefaehrdungssituation: r.gefaehrdungssituation ?? "",
        vereinbarungen: r.vereinbarungen ?? "",
        beteiligte: r.beteiligte ?? "",
        naechsterTermin: r.naechsterTermin ?? "",
        gesamtfreitext: r.gesamtfreitext ?? "",
        massnahmen: r.massnahmen.length > 0
            ? r.massnahmen.map((m) => ({
                massnahme: m.massnahme,
                verantwortlich: m.verantwortlich ?? "",
                bisDatum: m.bisDatum ?? "",
                status: m.status,
            }))
            : [emptyMassnahme()],
    };
}

export default function SchutzplanDetailPage() {
    const { fallId, schutzplanId } = useParams<{
        fallId: string;
        schutzplanId: string;
    }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;
    const sid = schutzplanId ? Number(schutzplanId) : null;

    const [data, setData]       = useState<SchutzplanResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState<FormState | null>(null);
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        if (!fid || !sid) return;
        setLoading(true);
        schutzplanApi
            .get(fid, sid)
            .then((r) => {
                setData(r);
                setForm(responseToForm(r));
            })
            .catch(() => setErr("Schutzplan konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid, sid]);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    }

    function updateMassnahme(index: number, field: keyof MassnahmeState, value: string) {
        setForm((prev) => {
            if (!prev) return prev;
            const massnahmen = [...prev.massnahmen];
            massnahmen[index] = { ...massnahmen[index], [field]: value };
            return { ...prev, massnahmen };
        });
    }

    function addMassnahme() {
        setForm((prev) =>
            prev ? { ...prev, massnahmen: [...prev.massnahmen, emptyMassnahme()] } : prev
        );
    }

    function removeMassnahme(index: number) {
        setForm((prev) =>
            prev
                ? { ...prev, massnahmen: prev.massnahmen.filter((_, i) => i !== index) }
                : prev
        );
    }

    async function handleSave() {
        if (!fid || !sid || !form) return;
        setSaving(true);
        try {
            const massnahmenReq: MassnahmeRequest[] = form.massnahmen
                .filter((m) => m.massnahme.trim())
                .map((m) => ({
                    massnahme: m.massnahme,
                    verantwortlich: m.verantwortlich || undefined,
                    bisDatum: m.bisDatum || null,
                    status: m.status || "OFFEN",
                }));

            const req: SchutzplanRequest = {
                erstelltAm: form.erstelltAm,
                gueltigBis: form.gueltigBis || null,
                status: form.status || "AKTIV",
                gefaehrdungssituation: form.gefaehrdungssituation || null,
                vereinbarungen: form.vereinbarungen || null,
                beteiligte: form.beteiligte || null,
                naechsterTermin: form.naechsterTermin || null,
                gesamtfreitext: form.gesamtfreitext || null,
                massnahmen: massnahmenReq,
            };

            const updated = await schutzplanApi.update(fid, sid, req);
            setData(updated);
            setForm(responseToForm(updated));
            setEditing(false);
            toast.success("Schutzplan gespeichert.");
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
                    <Topbar title="Schutzplan" />
                    <div className="p-8 text-center text-sm text-brand-text2">Lade…</div>
                </div>
            </AuthGate>
        );
    }

    if (err || !data || !form) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="Schutzplan" />
                    <div className="p-6 text-sm text-brand-danger">{err ?? "Nicht gefunden."}</div>
                </div>
            </AuthGate>
        );
    }

    const statusLabel = SCHUTZPLAN_STATUS_LABELS[data.status] ?? data.status;
    const statusClass =
        data.status === "AKTIV"
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
            : "bg-gray-100 text-gray-600 border border-gray-200";

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Schutzplan" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() =>
                                router.push(`/dashboard/falloeffnungen/${fid}/schutzplaene`)
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
                        <ShieldCheck className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                Schutzplan vom{" "}
                                {new Date(data.erstelltAm).toLocaleDateString("de-DE")}
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
                            {/* Grunddaten */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Grunddaten</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Erstellt am</label>
                                        <input
                                            type="date"
                                            value={form.erstelltAm}
                                            onChange={(e) => setField("erstelltAm", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Gültig bis (optional)</label>
                                        <input
                                            type="date"
                                            value={form.gueltigBis}
                                            onChange={(e) => setField("gueltigBis", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Status</label>
                                        <div className="flex flex-wrap gap-2">
                                            {["AKTIV", "ABGESCHLOSSEN"].map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setField("status", s)}
                                                    className={btnClass(form.status === s)}
                                                >
                                                    {s === "AKTIV" ? "Aktiv" : "Abgeschlossen"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gefährdungssituation */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Gefährdungssituation
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={form.gefaehrdungssituation}
                                        onChange={(e) => setField("gefaehrdungssituation", e.target.value)}
                                        rows={4}
                                        className="text-sm"
                                    />
                                </CardContent>
                            </Card>

                            {/* Schutzmaßnahmen */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Schutzmaßnahmen
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {form.massnahmen.map((m, index) => (
                                        <div
                                            key={index}
                                            className="rounded-xl border border-brand-border/30 bg-brand-bg p-3 space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-brand-text2">
                                                    Maßnahme {index + 1}
                                                </span>
                                                {form.massnahmen.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMassnahme(index)}
                                                        className="text-brand-danger hover:text-brand-danger/70 transition-colors"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div>
                                                <label className={LABEL_CLASS}>Maßnahme</label>
                                                <Textarea
                                                    value={m.massnahme}
                                                    onChange={(e) =>
                                                        updateMassnahme(index, "massnahme", e.target.value)
                                                    }
                                                    rows={2}
                                                    className="text-sm"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={LABEL_CLASS}>Verantwortlich</label>
                                                    <input
                                                        type="text"
                                                        value={m.verantwortlich}
                                                        onChange={(e) =>
                                                            updateMassnahme(index, "verantwortlich", e.target.value)
                                                        }
                                                        className={INPUT_CLASS}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={LABEL_CLASS}>Bis Datum</label>
                                                    <input
                                                        type="date"
                                                        value={m.bisDatum}
                                                        onChange={(e) =>
                                                            updateMassnahme(index, "bisDatum", e.target.value)
                                                        }
                                                        className={INPUT_CLASS}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className={LABEL_CLASS}>Status</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(MASSNAHME_STATUS_LABELS).map(([key, label]) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            onClick={() => updateMassnahme(index, "status", key)}
                                                            className={btnClass(m.status === key)}
                                                        >
                                                            {label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onClick={addMassnahme}
                                        className="w-full gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Maßnahme hinzufügen
                                    </Button>
                                </CardContent>
                            </Card>

                            {/* Vereinbarungen & Beteiligte */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Vereinbarungen &amp; Beteiligte
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Vereinbarungen</label>
                                        <Textarea
                                            value={form.vereinbarungen}
                                            onChange={(e) => setField("vereinbarungen", e.target.value)}
                                            rows={4}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Beteiligte Personen</label>
                                        <Textarea
                                            value={form.beteiligte}
                                            onChange={(e) => setField("beteiligte", e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Weiteres */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Weiteres</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Nächster Termin</label>
                                        <input
                                            type="date"
                                            value={form.naechsterTermin}
                                            onChange={(e) => setField("naechsterTermin", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Gesamtfreitext</label>
                                        <Textarea
                                            value={form.gesamtfreitext}
                                            onChange={(e) => setField("gesamtfreitext", e.target.value)}
                                            rows={3}
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
                            {/* Grunddaten */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Grunddaten</div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <ViewRow label="Erstellt am">
                                        {new Date(data.erstelltAm).toLocaleDateString("de-DE")}
                                    </ViewRow>
                                    <ViewRow label="Status">
                                        <span
                                            className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusClass}`}
                                        >
                                            {statusLabel}
                                        </span>
                                    </ViewRow>
                                    {data.gueltigBis && (
                                        <ViewRow label="Gültig bis">
                                            {new Date(data.gueltigBis).toLocaleDateString("de-DE")}
                                        </ViewRow>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Gefährdungssituation */}
                            {data.gefaehrdungssituation && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Gefährdungssituation
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-brand-text whitespace-pre-wrap">
                                            {data.gefaehrdungssituation}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Maßnahmen */}
                            {data.massnahmen.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Schutzmaßnahmen
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {data.massnahmen.map((m) => {
                                                const statusTone =
                                                    MASSNAHME_STATUS_TONE[m.status] ?? "text-brand-text2";
                                                const statusLabelM =
                                                    MASSNAHME_STATUS_LABELS[m.status] ?? m.status;
                                                return (
                                                    <div
                                                        key={m.id}
                                                        className="rounded-xl border border-brand-border/30 bg-brand-bg p-3 space-y-1.5"
                                                    >
                                                        <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                            {m.massnahme}
                                                        </p>
                                                        <div className="flex flex-wrap gap-3 text-xs text-brand-text2">
                                                            {m.verantwortlich && (
                                                                <span>Verantwortlich: {m.verantwortlich}</span>
                                                            )}
                                                            {m.bisDatum && (
                                                                <span>
                                                                    Bis:{" "}
                                                                    {new Date(m.bisDatum).toLocaleDateString("de-DE")}
                                                                </span>
                                                            )}
                                                            <span className={`font-medium ${statusTone}`}>
                                                                {statusLabelM}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Vereinbarungen & Beteiligte */}
                            {(data.vereinbarungen || data.beteiligte) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Vereinbarungen &amp; Beteiligte
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {data.vereinbarungen && (
                                            <div>
                                                <div className={LABEL_CLASS}>Vereinbarungen</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.vereinbarungen}
                                                </p>
                                            </div>
                                        )}
                                        {data.beteiligte && (
                                            <div>
                                                <div className={LABEL_CLASS}>Beteiligte Personen</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.beteiligte}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Weiteres */}
                            {(data.naechsterTermin || data.gesamtfreitext) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">Weiteres</div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {data.naechsterTermin && (
                                            <ViewRow label="Nächster Termin">
                                                {new Date(data.naechsterTermin).toLocaleDateString("de-DE")}
                                            </ViewRow>
                                        )}
                                        {data.gesamtfreitext && (
                                            <div>
                                                <div className={LABEL_CLASS}>Gesamtfreitext</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.gesamtfreitext}
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
