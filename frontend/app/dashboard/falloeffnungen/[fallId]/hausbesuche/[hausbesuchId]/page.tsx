"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    hausbesuchApi,
    type HausbesuchResponse,
    type HausbesuchRequest,
    AMPEL_LABELS,
    AMPEL_CLASSES,
    BEFUND_LABELS,
    BEFUND_TONE,
    STIMMUNG_LABELS,
    KOOPERATION_LABELS,
} from "@/lib/api/hausbesuch";
import { ArrowLeft, Edit2, Home } from "lucide-react";
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

function ampelBtnClass(key: string, active: boolean) {
    if (!active) {
        return "rounded-xl border px-4 py-2 text-sm font-medium transition-colors border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40";
    }
    if (key === "GRUEN") return "rounded-xl border px-4 py-2 text-sm font-medium transition-colors border-emerald-400 bg-emerald-50 text-emerald-700";
    if (key === "GELB")  return "rounded-xl border px-4 py-2 text-sm font-medium transition-colors border-yellow-400 bg-yellow-50 text-yellow-700";
    if (key === "ROT")   return "rounded-xl border px-4 py-2 text-sm font-medium transition-colors border-red-400 bg-red-50 text-red-700";
    return "rounded-xl border px-4 py-2 text-sm font-medium transition-colors border-brand-primary bg-brand-primary/10 text-brand-primary";
}

interface FormState {
    besuchsdatum: string;
    besuchszeitVon: string;
    besuchszeitBis: string;
    anwesende: string;
    whgOrdnung: string;
    whgHygiene: string;
    whgNahrungsversorgung: string;
    whgUnfallgefahren: string;
    whgSonstiges: string;
    kindErscheinungsbild: string;
    kindVerhalten: string;
    kindStimmung: string;
    kindAeusserungen: string;
    kindHinweiseGefaehrdung: string;
    bpErscheinungsbild: string;
    bpVerhalten: string;
    bpUmgangKind: string;
    bpKooperation: string;
    einschaetzungAmpel: string;
    einschaetzungText: string;
    naechsteSchritte: string;
    naechsterTermin: string;
}

function responseToForm(r: HausbesuchResponse): FormState {
    return {
        besuchsdatum: r.besuchsdatum,
        besuchszeitVon: r.besuchszeitVon ?? "",
        besuchszeitBis: r.besuchszeitBis ?? "",
        anwesende: r.anwesende ?? "",
        whgOrdnung: r.whgOrdnung ?? "",
        whgHygiene: r.whgHygiene ?? "",
        whgNahrungsversorgung: r.whgNahrungsversorgung ?? "",
        whgUnfallgefahren: r.whgUnfallgefahren ?? "",
        whgSonstiges: r.whgSonstiges ?? "",
        kindErscheinungsbild: r.kindErscheinungsbild ?? "",
        kindVerhalten: r.kindVerhalten ?? "",
        kindStimmung: r.kindStimmung ?? "",
        kindAeusserungen: r.kindAeusserungen ?? "",
        kindHinweiseGefaehrdung: r.kindHinweiseGefaehrdung ?? "",
        bpErscheinungsbild: r.bpErscheinungsbild ?? "",
        bpVerhalten: r.bpVerhalten ?? "",
        bpUmgangKind: r.bpUmgangKind ?? "",
        bpKooperation: r.bpKooperation ?? "",
        einschaetzungAmpel: r.einschaetzungAmpel ?? "",
        einschaetzungText: r.einschaetzungText ?? "",
        naechsteSchritte: r.naechsteSchritte ?? "",
        naechsterTermin: r.naechsterTermin ?? "",
    };
}

export default function HausbesuchDetailPage() {
    const { fallId, hausbesuchId } = useParams<{
        fallId: string;
        hausbesuchId: string;
    }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;
    const hid = hausbesuchId ? Number(hausbesuchId) : null;

    const [data, setData]       = useState<HausbesuchResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [form, setForm]       = useState<FormState | null>(null);
    const [saving, setSaving]   = useState(false);

    useEffect(() => {
        if (!fid || !hid) return;
        setLoading(true);
        hausbesuchApi
            .get(fid, hid)
            .then((r) => {
                setData(r);
                setForm(responseToForm(r));
            })
            .catch(() => setErr("Hausbesuch konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid, hid]);

    function setField<K extends keyof FormState>(key: K, value: string) {
        setForm((prev) => prev ? { ...prev, [key]: value } : prev);
    }

    function toggleField(key: keyof FormState, newValue: string) {
        setForm((prev) => {
            if (!prev) return prev;
            return { ...prev, [key]: prev[key] === newValue ? "" : newValue };
        });
    }

    async function handleSave() {
        if (!fid || !hid || !form) return;
        setSaving(true);
        try {
            const req: HausbesuchRequest = {
                besuchsdatum: form.besuchsdatum,
                besuchszeitVon: form.besuchszeitVon || null,
                besuchszeitBis: form.besuchszeitBis || null,
                anwesende: form.anwesende || null,
                whgOrdnung: form.whgOrdnung || null,
                whgHygiene: form.whgHygiene || null,
                whgNahrungsversorgung: form.whgNahrungsversorgung || null,
                whgUnfallgefahren: form.whgUnfallgefahren || null,
                whgSonstiges: form.whgSonstiges || null,
                kindErscheinungsbild: form.kindErscheinungsbild || null,
                kindVerhalten: form.kindVerhalten || null,
                kindStimmung: form.kindStimmung || null,
                kindAeusserungen: form.kindAeusserungen || null,
                kindHinweiseGefaehrdung: form.kindHinweiseGefaehrdung || null,
                bpErscheinungsbild: form.bpErscheinungsbild || null,
                bpVerhalten: form.bpVerhalten || null,
                bpUmgangKind: form.bpUmgangKind || null,
                bpKooperation: form.bpKooperation || null,
                einschaetzungAmpel: form.einschaetzungAmpel || null,
                einschaetzungText: form.einschaetzungText || null,
                naechsteSchritte: form.naechsteSchritte || null,
                naechsterTermin: form.naechsterTermin || null,
            };
            const updated = await hausbesuchApi.update(fid, hid, req);
            setData(updated);
            setForm(responseToForm(updated));
            setEditing(false);
            toast.success("Hausbesuch gespeichert.");
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
                    <Topbar title="Hausbesuchsprotokoll" />
                    <div className="p-8 text-center text-sm text-brand-text2">Lade…</div>
                </div>
            </AuthGate>
        );
    }

    if (err || !data || !form) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="Hausbesuchsprotokoll" />
                    <div className="p-6 text-sm text-brand-danger">{err ?? "Nicht gefunden."}</div>
                </div>
            </AuthGate>
        );
    }

    const befundKeys = Object.keys(BEFUND_LABELS);
    const ampelClass = data.einschaetzungAmpel
        ? (AMPEL_CLASSES[data.einschaetzungAmpel] ?? "")
        : "";
    const ampelLabel = data.einschaetzungAmpel
        ? (AMPEL_LABELS[data.einschaetzungAmpel] ?? data.einschaetzungAmpel)
        : null;

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Hausbesuchsprotokoll" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() =>
                                router.push(`/dashboard/falloeffnungen/${fid}/hausbesuche`)
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
                        <Home className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                Hausbesuch vom{" "}
                                {new Date(data.besuchsdatum).toLocaleDateString("de-DE")}
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
                                        <label className={LABEL_CLASS}>Besuchsdatum</label>
                                        <input
                                            type="date"
                                            value={form.besuchsdatum}
                                            onChange={(e) => setField("besuchsdatum", e.target.value)}
                                            className={INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={LABEL_CLASS}>Zeit von</label>
                                            <input
                                                type="time"
                                                value={form.besuchszeitVon}
                                                onChange={(e) => setField("besuchszeitVon", e.target.value)}
                                                className={INPUT_CLASS}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLASS}>Zeit bis</label>
                                            <input
                                                type="time"
                                                value={form.besuchszeitBis}
                                                onChange={(e) => setField("besuchszeitBis", e.target.value)}
                                                className={INPUT_CLASS}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Anwesende Personen</label>
                                        <Textarea
                                            value={form.anwesende}
                                            onChange={(e) => setField("anwesende", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Wohnsituation */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Wohnsituation</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {(
                                        [
                                            { key: "whgOrdnung" as keyof FormState, label: "Ordnung / Sauberkeit" },
                                            { key: "whgHygiene" as keyof FormState, label: "Hygiene" },
                                            { key: "whgNahrungsversorgung" as keyof FormState, label: "Nahrungsversorgung" },
                                        ] as const
                                    ).map(({ key, label }) => (
                                        <div key={key}>
                                            <label className={LABEL_CLASS}>{label}</label>
                                            <div className="flex flex-wrap gap-2">
                                                {befundKeys.map((k) => (
                                                    <button
                                                        key={k}
                                                        type="button"
                                                        onClick={() => toggleField(key, k)}
                                                        className={btnClass(form[key] === k)}
                                                    >
                                                        {BEFUND_LABELS[k]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div>
                                        <label className={LABEL_CLASS}>Unfallgefahren / Sicherheitsmängel</label>
                                        <Textarea
                                            value={form.whgUnfallgefahren}
                                            onChange={(e) => setField("whgUnfallgefahren", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Sonstiges</label>
                                        <Textarea
                                            value={form.whgSonstiges}
                                            onChange={(e) => setField("whgSonstiges", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Beobachtungen Kind */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Beobachtungen Kind
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Erscheinungsbild</label>
                                        <Textarea
                                            value={form.kindErscheinungsbild}
                                            onChange={(e) => setField("kindErscheinungsbild", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Verhalten</label>
                                        <Textarea
                                            value={form.kindVerhalten}
                                            onChange={(e) => setField("kindVerhalten", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Stimmung</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(STIMMUNG_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("kindStimmung", key)}
                                                    className={btnClass(form.kindStimmung === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Äußerungen des Kindes</label>
                                        <Textarea
                                            value={form.kindAeusserungen}
                                            onChange={(e) => setField("kindAeusserungen", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Hinweise auf Gefährdung</label>
                                        <Textarea
                                            value={form.kindHinweiseGefaehrdung}
                                            onChange={(e) => setField("kindHinweiseGefaehrdung", e.target.value)}
                                            rows={3}
                                            className="text-sm border-yellow-300 focus:ring-yellow-400/30"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Beobachtungen Bezugspersonen */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Beobachtungen Bezugspersonen
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Erscheinungsbild</label>
                                        <Textarea
                                            value={form.bpErscheinungsbild}
                                            onChange={(e) => setField("bpErscheinungsbild", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Verhalten</label>
                                        <Textarea
                                            value={form.bpVerhalten}
                                            onChange={(e) => setField("bpVerhalten", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Umgang mit dem Kind</label>
                                        <Textarea
                                            value={form.bpUmgangKind}
                                            onChange={(e) => setField("bpUmgangKind", e.target.value)}
                                            rows={2}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Kooperation</label>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(KOOPERATION_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("bpKooperation", key)}
                                                    className={btnClass(form.bpKooperation === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Gesamteinschätzung */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">
                                        Gesamteinschätzung
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className={LABEL_CLASS}>Ampel-Einschätzung</label>
                                        <div className="flex flex-wrap gap-3">
                                            {Object.entries(AMPEL_LABELS).map(([key, label]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => toggleField("einschaetzungAmpel", key)}
                                                    className={ampelBtnClass(key, form.einschaetzungAmpel === key)}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Einschätzung</label>
                                        <Textarea
                                            value={form.einschaetzungText}
                                            onChange={(e) => setField("einschaetzungText", e.target.value)}
                                            rows={4}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Nächste Schritte</label>
                                        <Textarea
                                            value={form.naechsteSchritte}
                                            onChange={(e) => setField("naechsteSchritte", e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLASS}>Nächster Termin</label>
                                        <input
                                            type="date"
                                            value={form.naechsterTermin}
                                            onChange={(e) => setField("naechsterTermin", e.target.value)}
                                            className={INPUT_CLASS}
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
                            {/* Ampel prominent */}
                            {ampelLabel && (
                                <div
                                    className={`rounded-2xl border px-5 py-3 text-sm font-semibold ${ampelClass}`}
                                >
                                    {ampelLabel}
                                </div>
                            )}

                            {/* Grunddaten */}
                            <Card>
                                <CardHeader className="pb-2">
                                    <div className="text-sm font-semibold text-brand-text">Grunddaten</div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <ViewRow label="Besuchsdatum">
                                        {new Date(data.besuchsdatum).toLocaleDateString("de-DE")}
                                    </ViewRow>
                                    {(data.besuchszeitVon || data.besuchszeitBis) && (
                                        <ViewRow label="Uhrzeit">
                                            {[data.besuchszeitVon, data.besuchszeitBis]
                                                .filter(Boolean)
                                                .join(" – ")}
                                        </ViewRow>
                                    )}
                                    {data.anwesende && (
                                        <ViewRow label="Anwesende Personen">{data.anwesende}</ViewRow>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Wohnsituation */}
                            {(data.whgOrdnung ||
                                data.whgHygiene ||
                                data.whgNahrungsversorgung ||
                                data.whgUnfallgefahren ||
                                data.whgSonstiges) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Wohnsituation
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {(
                                            [
                                                { val: data.whgOrdnung, label: "Ordnung / Sauberkeit" },
                                                { val: data.whgHygiene, label: "Hygiene" },
                                                { val: data.whgNahrungsversorgung, label: "Nahrungsversorgung" },
                                            ] as const
                                        ).map(
                                            ({ val, label }) =>
                                                val && (
                                                    <ViewRow key={label} label={label}>
                                                        <span
                                                            className={`font-medium ${BEFUND_TONE[val] ?? "text-brand-text"}`}
                                                        >
                                                            {BEFUND_LABELS[val] ?? val}
                                                        </span>
                                                    </ViewRow>
                                                )
                                        )}
                                        {data.whgUnfallgefahren && (
                                            <div>
                                                <div className={LABEL_CLASS}>Unfallgefahren / Sicherheitsmängel</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.whgUnfallgefahren}
                                                </p>
                                            </div>
                                        )}
                                        {data.whgSonstiges && (
                                            <div>
                                                <div className={LABEL_CLASS}>Sonstiges</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.whgSonstiges}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Beobachtungen Kind */}
                            {(data.kindErscheinungsbild ||
                                data.kindVerhalten ||
                                data.kindStimmung ||
                                data.kindAeusserungen ||
                                data.kindHinweiseGefaehrdung) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Beobachtungen Kind
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {data.kindErscheinungsbild && (
                                            <div>
                                                <div className={LABEL_CLASS}>Erscheinungsbild</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.kindErscheinungsbild}
                                                </p>
                                            </div>
                                        )}
                                        {data.kindVerhalten && (
                                            <div>
                                                <div className={LABEL_CLASS}>Verhalten</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.kindVerhalten}
                                                </p>
                                            </div>
                                        )}
                                        {data.kindStimmung && (
                                            <ViewRow label="Stimmung">
                                                {STIMMUNG_LABELS[data.kindStimmung] ?? data.kindStimmung}
                                            </ViewRow>
                                        )}
                                        {data.kindAeusserungen && (
                                            <div>
                                                <div className={LABEL_CLASS}>Äußerungen des Kindes</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.kindAeusserungen}
                                                </p>
                                            </div>
                                        )}
                                        {data.kindHinweiseGefaehrdung && (
                                            <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3">
                                                <div className="text-xs font-medium text-yellow-700 mb-1">
                                                    Hinweise auf Gefährdung
                                                </div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.kindHinweiseGefaehrdung}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Beobachtungen Bezugspersonen */}
                            {(data.bpErscheinungsbild ||
                                data.bpVerhalten ||
                                data.bpUmgangKind ||
                                data.bpKooperation) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Beobachtungen Bezugspersonen
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {data.bpErscheinungsbild && (
                                            <div>
                                                <div className={LABEL_CLASS}>Erscheinungsbild</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.bpErscheinungsbild}
                                                </p>
                                            </div>
                                        )}
                                        {data.bpVerhalten && (
                                            <div>
                                                <div className={LABEL_CLASS}>Verhalten</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.bpVerhalten}
                                                </p>
                                            </div>
                                        )}
                                        {data.bpUmgangKind && (
                                            <div>
                                                <div className={LABEL_CLASS}>Umgang mit dem Kind</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.bpUmgangKind}
                                                </p>
                                            </div>
                                        )}
                                        {data.bpKooperation && (
                                            <ViewRow label="Kooperation">
                                                {KOOPERATION_LABELS[data.bpKooperation] ?? data.bpKooperation}
                                            </ViewRow>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Gesamteinschätzung */}
                            {(data.einschaetzungText ||
                                data.naechsteSchritte ||
                                data.naechsterTermin) && (
                                <Card>
                                    <CardHeader className="pb-2">
                                        <div className="text-sm font-semibold text-brand-text">
                                            Gesamteinschätzung
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {data.einschaetzungText && (
                                            <div>
                                                <div className={LABEL_CLASS}>Einschätzung</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.einschaetzungText}
                                                </p>
                                            </div>
                                        )}
                                        {data.naechsteSchritte && (
                                            <div>
                                                <div className={LABEL_CLASS}>Nächste Schritte</div>
                                                <p className="text-sm text-brand-text whitespace-pre-wrap">
                                                    {data.naechsteSchritte}
                                                </p>
                                            </div>
                                        )}
                                        {data.naechsterTermin && (
                                            <ViewRow label="Nächster Termin">
                                                {new Date(data.naechsterTermin).toLocaleDateString("de-DE")}
                                            </ViewRow>
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
