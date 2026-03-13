"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    hausbesuchApi,
    type HausbesuchRequest,
    AMPEL_LABELS,
    BEFUND_LABELS,
    STIMMUNG_LABELS,
    KOOPERATION_LABELS,
} from "@/lib/api/hausbesuch";
import { ArrowLeft, Home } from "lucide-react";
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

const initialState: FormState = {
    besuchsdatum: new Date().toISOString().slice(0, 10),
    besuchszeitVon: "",
    besuchszeitBis: "",
    anwesende: "",
    whgOrdnung: "",
    whgHygiene: "",
    whgNahrungsversorgung: "",
    whgUnfallgefahren: "",
    whgSonstiges: "",
    kindErscheinungsbild: "",
    kindVerhalten: "",
    kindStimmung: "",
    kindAeusserungen: "",
    kindHinweiseGefaehrdung: "",
    bpErscheinungsbild: "",
    bpVerhalten: "",
    bpUmgangKind: "",
    bpKooperation: "",
    einschaetzungAmpel: "",
    einschaetzungText: "",
    naechsteSchritte: "",
    naechsterTermin: "",
};

export default function HausbesuchNeuPage() {
    const { fallId } = useParams<{ fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [form, setForm] = useState<FormState>(initialState);
    const [saving, setSaving] = useState(false);

    function setField<K extends keyof FormState>(key: K, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function toggleField(key: keyof FormState, newValue: string) {
        setForm((prev) => ({ ...prev, [key]: prev[key] === newValue ? "" : newValue }));
    }

    async function handleSave() {
        if (!fid) return;
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
            const result = await hausbesuchApi.create(fid, req);
            toast.success("Hausbesuch gespeichert.");
            router.push(`/dashboard/falloeffnungen/${fid}/hausbesuche/${result.id}`);
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    }

    const befundKeys = Object.keys(BEFUND_LABELS);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Neues Hausbesuchsprotokoll" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 px-1">
                        <Home className="h-5 w-5 text-brand-text2" />
                        <div className="text-base font-semibold text-brand-text">
                            Neues Hausbesuchsprotokoll
                        </div>
                    </div>

                    {/* Section 1: Grunddaten */}
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
                                    placeholder="Anwesende Personen beim Hausbesuch…"
                                    rows={2}
                                    className="text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 2: Wohnsituation */}
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

                    {/* Section 3: Beobachtungen Kind */}
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

                    {/* Section 4: Beobachtungen Bezugspersonen */}
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

                    {/* Section 5: Gesamteinschätzung */}
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
                                    placeholder="Fachliche Gesamteinschätzung…"
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

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? "Wird gespeichert…" : "Protokoll speichern"}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}
