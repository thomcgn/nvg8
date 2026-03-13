"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AMPEL_LABELS, AMPEL_CLASSES } from "@/lib/api/hausbesuch";

export interface HausbesuchState {
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
    einschaetzungAmpel: string | null;
    einschaetzungText: string;
    naechsteSchritte: string;
    naechsterTermin: string;
}

export function defaultHausbesuchState(): HausbesuchState {
    return {
        besuchsdatum: new Date().toISOString().split("T")[0],
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
        einschaetzungAmpel: null,
        einschaetzungText: "",
        naechsteSchritte: "",
        naechsterTermin: "",
    };
}

const AMPEL_CODES = ["GRUEN", "GELB", "ROT"] as const;

interface Props {
    form: HausbesuchState;
    onChange: (form: HausbesuchState) => void;
    disabled?: boolean;
}

function TextAreaField({
    label,
    value,
    onChange,
    placeholder,
    rows = 2,
    disabled,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-brand-text2 block mb-1">{label}</label>
            <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} disabled={disabled} className="text-sm" />
        </div>
    );
}

export function HausbesuchTabContent({ form, onChange, disabled }: Props) {
    return (
        <div className="space-y-4">
            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Angaben</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-brand-text2 block mb-1">Datum</label>
                            <input
                                type="date"
                                value={form.besuchsdatum}
                                onChange={(e) => onChange({ ...form, besuchsdatum: e.target.value })}
                                disabled={disabled}
                                className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-brand-text2 block mb-1">Von</label>
                            <input
                                type="time"
                                value={form.besuchszeitVon}
                                onChange={(e) => onChange({ ...form, besuchszeitVon: e.target.value })}
                                disabled={disabled}
                                className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white w-full"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-brand-text2 block mb-1">Bis</label>
                            <input
                                type="time"
                                value={form.besuchszeitBis}
                                onChange={(e) => onChange({ ...form, besuchszeitBis: e.target.value })}
                                disabled={disabled}
                                className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-brand-text2 block mb-1">Anwesende Personen</label>
                        <Input
                            value={form.anwesende}
                            onChange={(e) => onChange({ ...form, anwesende: e.target.value })}
                            placeholder="z.B. Mutter, Kind, Vater…"
                            disabled={disabled}
                            className="text-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Wohnsituation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <TextAreaField label="Ordnung / Sauberkeit" value={form.whgOrdnung} onChange={(v) => onChange({ ...form, whgOrdnung: v })} disabled={disabled} />
                    <TextAreaField label="Hygiene" value={form.whgHygiene} onChange={(v) => onChange({ ...form, whgHygiene: v })} disabled={disabled} />
                    <TextAreaField label="Nahrungsversorgung" value={form.whgNahrungsversorgung} onChange={(v) => onChange({ ...form, whgNahrungsversorgung: v })} disabled={disabled} />
                    <TextAreaField label="Unfallgefahren" value={form.whgUnfallgefahren} onChange={(v) => onChange({ ...form, whgUnfallgefahren: v })} disabled={disabled} />
                    <TextAreaField label="Sonstiges" value={form.whgSonstiges} onChange={(v) => onChange({ ...form, whgSonstiges: v })} disabled={disabled} />
                </CardContent>
            </Card>

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Beobachtungen Kind</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <TextAreaField label="Erscheinungsbild" value={form.kindErscheinungsbild} onChange={(v) => onChange({ ...form, kindErscheinungsbild: v })} disabled={disabled} />
                    <TextAreaField label="Verhalten" value={form.kindVerhalten} onChange={(v) => onChange({ ...form, kindVerhalten: v })} disabled={disabled} />
                    <TextAreaField label="Stimmung" value={form.kindStimmung} onChange={(v) => onChange({ ...form, kindStimmung: v })} disabled={disabled} />
                    <TextAreaField label="Äußerungen" value={form.kindAeusserungen} onChange={(v) => onChange({ ...form, kindAeusserungen: v })} disabled={disabled} />
                    <TextAreaField label="Hinweise auf Gefährdung" value={form.kindHinweiseGefaehrdung} onChange={(v) => onChange({ ...form, kindHinweiseGefaehrdung: v })} disabled={disabled} />
                </CardContent>
            </Card>

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Beobachtungen Bezugspersonen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <TextAreaField label="Erscheinungsbild" value={form.bpErscheinungsbild} onChange={(v) => onChange({ ...form, bpErscheinungsbild: v })} disabled={disabled} />
                    <TextAreaField label="Verhalten" value={form.bpVerhalten} onChange={(v) => onChange({ ...form, bpVerhalten: v })} disabled={disabled} />
                    <TextAreaField label="Umgang mit Kind" value={form.bpUmgangKind} onChange={(v) => onChange({ ...form, bpUmgangKind: v })} disabled={disabled} />
                    <TextAreaField label="Kooperation" value={form.bpKooperation} onChange={(v) => onChange({ ...form, bpKooperation: v })} disabled={disabled} />
                </CardContent>
            </Card>

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Einschätzung & nächste Schritte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <div className="text-xs font-semibold text-brand-text2 mb-2">Ampeleinschätzung</div>
                        <div className="flex flex-wrap gap-2">
                            {AMPEL_CODES.map((a) => (
                                <button
                                    key={a}
                                    disabled={disabled}
                                    onClick={() => onChange({ ...form, einschaetzungAmpel: form.einschaetzungAmpel === a ? null : a })}
                                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                                        form.einschaetzungAmpel === a
                                            ? AMPEL_CLASSES[a]
                                            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                    }`}
                                >
                                    {AMPEL_LABELS[a]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <TextAreaField label="Einschätzungstext" value={form.einschaetzungText} onChange={(v) => onChange({ ...form, einschaetzungText: v })} placeholder="Fachliche Einschätzung…" rows={3} disabled={disabled} />
                    <TextAreaField label="Nächste Schritte" value={form.naechsteSchritte} onChange={(v) => onChange({ ...form, naechsteSchritte: v })} placeholder="Geplante Folgeschritte…" rows={2} disabled={disabled} />
                    <div>
                        <label className="text-xs font-semibold text-brand-text2 block mb-1">Nächster Termin</label>
                        <input
                            type="date"
                            value={form.naechsterTermin}
                            onChange={(e) => onChange({ ...form, naechsterTermin: e.target.value })}
                            disabled={disabled}
                            className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white focus:outline-none"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
