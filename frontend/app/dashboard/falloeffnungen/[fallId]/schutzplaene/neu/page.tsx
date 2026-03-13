"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    schutzplanApi,
    type SchutzplanRequest,
    type MassnahmeRequest,
    MASSNAHME_STATUS_LABELS,
} from "@/lib/api/schutzplan";
import { ArrowLeft, Plus, Trash2, ShieldCheck } from "lucide-react";
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

const initialState: FormState = {
    erstelltAm: new Date().toISOString().slice(0, 10),
    gueltigBis: "",
    status: "AKTIV",
    gefaehrdungssituation: "",
    vereinbarungen: "",
    beteiligte: "",
    naechsterTermin: "",
    gesamtfreitext: "",
    massnahmen: [emptyMassnahme()],
};

export default function SchutzplanNeuPage() {
    const { fallId } = useParams<{ fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [form, setForm] = useState<FormState>(initialState);
    const [saving, setSaving] = useState(false);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function updateMassnahme(index: number, field: keyof MassnahmeState, value: string) {
        setForm((prev) => {
            const massnahmen = [...prev.massnahmen];
            massnahmen[index] = { ...massnahmen[index], [field]: value };
            return { ...prev, massnahmen };
        });
    }

    function addMassnahme() {
        setForm((prev) => ({
            ...prev,
            massnahmen: [...prev.massnahmen, emptyMassnahme()],
        }));
    }

    function removeMassnahme(index: number) {
        setForm((prev) => ({
            ...prev,
            massnahmen: prev.massnahmen.filter((_, i) => i !== index),
        }));
    }

    async function handleSave() {
        if (!fid) return;
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

            const result = await schutzplanApi.create(fid, req);
            toast.success("Schutzplan gespeichert.");
            router.push(`/dashboard/falloeffnungen/${fid}/schutzplaene/${result.id}`);
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Neuer Schutzplan" />

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
                        <ShieldCheck className="h-5 w-5 text-brand-text2" />
                        <div className="text-base font-semibold text-brand-text">
                            Neuer Schutzplan
                        </div>
                    </div>

                    {/* Section 1: Grunddaten */}
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

                    {/* Section 2: Gefährdungssituation */}
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
                                placeholder="Beschreibung der Gefährdungssituation…"
                                rows={4}
                                className="text-sm"
                            />
                        </CardContent>
                    </Card>

                    {/* Section 3: Schutzmaßnahmen */}
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
                                            placeholder="Maßnahme beschreiben…"
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
                                                placeholder="Person/Stelle…"
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

                    {/* Section 4: Vereinbarungen & Beteiligte */}
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
                                    placeholder="Vereinbarungen mit der Familie…"
                                    rows={4}
                                    className="text-sm"
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLASS}>Beteiligte Personen</label>
                                <Textarea
                                    value={form.beteiligte}
                                    onChange={(e) => setField("beteiligte", e.target.value)}
                                    placeholder="Beteiligte Personen und Stellen…"
                                    rows={3}
                                    className="text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 5: Weiteres */}
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
                                    placeholder="Weitere Anmerkungen…"
                                    rows={3}
                                    className="text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="gap-2">
                            {saving ? "Wird gespeichert…" : "Schutzplan speichern"}
                        </Button>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}
