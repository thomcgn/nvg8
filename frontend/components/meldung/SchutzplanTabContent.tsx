"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { MASSNAHME_STATUS_LABELS } from "@/lib/api/schutzplan";

export interface SchutzplanState {
    erstelltAm: string;
    gueltigBis: string;
    naechsterTermin: string;
    gefaehrdungssituation: string;
    vereinbarungen: string;
    beteiligte: string;
    gesamtfreitext: string;
    massnahmen: Array<{
        massnahme: string;
        verantwortlich: string;
        bisDatum: string;
        status: string;
    }>;
}

export function defaultSchutzplanState(): SchutzplanState {
    const today = new Date().toISOString().split("T")[0];
    return {
        erstelltAm: today,
        gueltigBis: "",
        naechsterTermin: "",
        gefaehrdungssituation: "",
        vereinbarungen: "",
        beteiligte: "",
        gesamtfreitext: "",
        massnahmen: [],
    };
}

const MASSNAHME_STATI = ["OFFEN", "IN_UMSETZUNG", "ERLEDIGT", "NICHT_ERLEDIGT"] as const;

interface Props {
    form: SchutzplanState;
    onChange: (form: SchutzplanState) => void;
    disabled?: boolean;
}

export function SchutzplanTabContent({ form, onChange, disabled }: Props) {
    const addMassnahme = () =>
        onChange({
            ...form,
            massnahmen: [...form.massnahmen, { massnahme: "", verantwortlich: "", bisDatum: "", status: "OFFEN" }],
        });

    const updateMassnahme = (idx: number, patch: Partial<(typeof form.massnahmen)[number]>) => {
        const next = [...form.massnahmen];
        next[idx] = { ...next[idx], ...patch };
        onChange({ ...form, massnahmen: next });
    };

    const removeMassnahme = (idx: number) => {
        const next = [...form.massnahmen];
        next.splice(idx, 1);
        onChange({ ...form, massnahmen: next });
    };

    return (
        <div className="space-y-4">
            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Angaben</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-brand-text2 block mb-1">Erstellt am</label>
                            <input
                                type="date"
                                value={form.erstelltAm}
                                onChange={(e) => onChange({ ...form, erstelltAm: e.target.value })}
                                disabled={disabled}
                                className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white w-full focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-brand-text2 block mb-1">Gültig bis</label>
                            <input
                                type="date"
                                value={form.gueltigBis}
                                onChange={(e) => onChange({ ...form, gueltigBis: e.target.value })}
                                disabled={disabled}
                                className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white w-full focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-brand-text2 block mb-1">Nächster Überprüfungstermin</label>
                        <input
                            type="date"
                            value={form.naechsterTermin}
                            onChange={(e) => onChange({ ...form, naechsterTermin: e.target.value })}
                            disabled={disabled}
                            className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Inhalt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {(
                        [
                            ["gefaehrdungssituation", "Gefährdungssituation", "Beschreibung der Gefährdungssituation…", 3],
                            ["vereinbarungen", "Vereinbarungen", "Getroffene Vereinbarungen…", 3],
                            ["beteiligte", "Beteiligte", "Alle am Schutzplan beteiligten Personen…", 2],
                            ["gesamtfreitext", "Weitere Anmerkungen", "", 2],
                        ] as const
                    ).map(([field, label, placeholder, rows]) => (
                        <div key={field}>
                            <label className="text-xs font-semibold text-brand-text2 block mb-1">{label}</label>
                            <Textarea
                                value={form[field]}
                                onChange={(e) => onChange({ ...form, [field]: e.target.value })}
                                placeholder={placeholder}
                                rows={rows}
                                disabled={disabled}
                                className="text-sm"
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-brand-text">
                            Maßnahmen ({form.massnahmen.length})
                        </CardTitle>
                        {!disabled && (
                            <Button variant="secondary" size="sm" className="gap-2" onClick={addMassnahme}>
                                <Plus className="h-3.5 w-3.5" />
                                Hinzufügen
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {form.massnahmen.length === 0 && (
                        <div className="py-4 text-sm text-brand-text2 text-center">Noch keine Maßnahmen erfasst.</div>
                    )}
                    {form.massnahmen.map((m, idx) => (
                        <div key={idx} className="rounded-2xl border border-brand-border/30 p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-semibold text-brand-text2">Maßnahme {idx + 1}</div>
                                {!disabled && (
                                    <button type="button" onClick={() => removeMassnahme(idx)} className="text-brand-text2 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Textarea
                                value={m.massnahme}
                                onChange={(e) => updateMassnahme(idx, { massnahme: e.target.value })}
                                placeholder="Beschreibung der Maßnahme…"
                                rows={2}
                                disabled={disabled}
                                className="text-sm"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-xs text-brand-text2 block mb-1">Verantwortlich</label>
                                    <Input
                                        value={m.verantwortlich}
                                        onChange={(e) => updateMassnahme(idx, { verantwortlich: e.target.value })}
                                        placeholder="Person / Stelle…"
                                        disabled={disabled}
                                        className="text-sm h-8"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-text2 block mb-1">Bis Datum</label>
                                    <input
                                        type="date"
                                        value={m.bisDatum}
                                        onChange={(e) => updateMassnahme(idx, { bisDatum: e.target.value })}
                                        disabled={disabled}
                                        className="border border-brand-border/40 rounded-xl px-3 py-1.5 text-sm text-brand-text bg-white w-full focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {MASSNAHME_STATI.map((s) => (
                                    <button
                                        key={s}
                                        disabled={disabled}
                                        onClick={() => updateMassnahme(idx, { status: s })}
                                        className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                                            m.status === s
                                                ? "bg-brand-primary/10 border-brand-primary text-brand-primary"
                                                : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                        }`}
                                    >
                                        {MASSNAHME_STATUS_LABELS[s] ?? s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
