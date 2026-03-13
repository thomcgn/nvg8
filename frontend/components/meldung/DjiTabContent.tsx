"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
    type DjiKatalogResponse,
    type DjiKatalogItem,
    SECHSSTUFEN,
    SECHSSTUFEN_LABELS,
    SECHSSTUFEN_ACTIVE,
    GESAMT_TONE,
} from "@/lib/api/dji";
import { ChevronDown, ChevronUp } from "lucide-react";

export interface DjiPositionState {
    belege: string;
    bewertungBool: boolean | null;
    bewertungStufe: number | null;
    open: boolean;
}

export interface DjiFormState {
    bewertungsdatum: string;
    positionen: Record<string, DjiPositionState>;
    gesamteinschaetzung: string | null;
    gesamtfreitext: string;
}

export function defaultDjiFormState(): DjiFormState {
    return {
        bewertungsdatum: new Date().toISOString().split("T")[0],
        positionen: {},
        gesamteinschaetzung: null,
        gesamtfreitext: "",
    };
}

export function initDjiPositionen(katalog: DjiKatalogResponse): Record<string, DjiPositionState> {
    const init: Record<string, DjiPositionState> = {};
    katalog.positionen.forEach((p) => {
        init[p.code] = { belege: "", bewertungBool: null, bewertungStufe: null, open: true };
    });
    return init;
}

interface Props {
    katalog: DjiKatalogResponse | null;
    katalogLoading: boolean;
    form: DjiFormState;
    onChange: (form: DjiFormState) => void;
    disabled?: boolean;
}

export function DjiTabContent({ katalog, katalogLoading, form, onChange, disabled }: Props) {
    const gruppiertNachBereich = katalog
        ? katalog.positionen.reduce<Record<string, DjiKatalogItem[]>>((acc, item) => {
              const key = item.bereich ?? "Kriterien";
              if (!acc[key]) acc[key] = [];
              acc[key].push(item);
              return acc;
          }, {})
        : {};

    const updatePosition = (code: string, patch: Partial<DjiPositionState>) => {
        const prev = form.positionen[code] ?? { belege: "", bewertungBool: null, bewertungStufe: null, open: true };
        onChange({ ...form, positionen: { ...form.positionen, [code]: { ...prev, ...patch } } });
    };

    if (katalogLoading) {
        return <div className="py-8 text-sm text-brand-text2 text-center">Katalog wird geladen…</div>;
    }
    if (!katalog) {
        return <div className="py-8 text-sm text-red-600 text-center">Katalog konnte nicht geladen werden.</div>;
    }

    return (
        <div className="space-y-4">
            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-brand-text">{katalog.formTypLabel}</CardTitle>
                    {katalog.beschreibung && <p className="text-xs text-brand-text2">{katalog.beschreibung}</p>}
                </CardHeader>
                <CardContent>
                    <label className="block text-xs font-medium text-brand-text2 mb-1">Datum</label>
                    <input
                        type="date"
                        value={form.bewertungsdatum}
                        onChange={(e) => onChange({ ...form, bewertungsdatum: e.target.value })}
                        disabled={disabled}
                        className="rounded-xl border border-brand-border/40 bg-white px-3 py-2 text-sm text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                    />
                </CardContent>
            </Card>

            {Object.entries(gruppiertNachBereich).map(([bereich, items]) => (
                <Card key={bereich} className="border border-brand-border/40 shadow-sm">
                    {bereich !== "Kriterien" && (
                        <CardHeader className="pb-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">{bereich}</div>
                        </CardHeader>
                    )}
                    <CardContent className="space-y-4">
                        {items.map((item) => {
                            const state = form.positionen[item.code] ?? {
                                belege: "",
                                bewertungBool: null,
                                bewertungStufe: null,
                                open: true,
                            };
                            return (
                                <DjiPositionRow
                                    key={item.code}
                                    item={item}
                                    state={state}
                                    onUpdate={(patch) => updatePosition(item.code, patch)}
                                    disabled={disabled}
                                />
                            );
                        })}
                    </CardContent>
                </Card>
            ))}

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-brand-text">Gesamteinschätzung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {katalog.gesamteinschaetzungOptionen.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {katalog.gesamteinschaetzungOptionen.map((opt) => {
                                const active = form.gesamteinschaetzung === opt.code;
                                const toneClass = GESAMT_TONE[opt.code] ?? "text-brand-text2";
                                return (
                                    <button
                                        key={opt.code}
                                        disabled={disabled}
                                        onClick={() =>
                                            onChange({ ...form, gesamteinschaetzung: active ? null : opt.code })
                                        }
                                        className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                                            active
                                                ? `border-brand-primary bg-brand-primary/10 ${toneClass}`
                                                : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    <Textarea
                        value={form.gesamtfreitext}
                        onChange={(e) => onChange({ ...form, gesamtfreitext: e.target.value })}
                        placeholder="Zusammenfassende fachliche Einschätzung…"
                        rows={4}
                        className="text-sm"
                        disabled={disabled}
                    />
                </CardContent>
            </Card>
        </div>
    );
}

function DjiPositionRow({
    item,
    state,
    onUpdate,
    disabled,
}: {
    item: DjiKatalogItem;
    state: DjiPositionState;
    onUpdate: (patch: Partial<DjiPositionState>) => void;
    disabled?: boolean;
}) {
    return (
        <div className="border-b border-brand-border/20 last:border-0 pb-4 last:pb-0">
            <button
                className="flex items-start justify-between gap-2 w-full text-left"
                onClick={() => onUpdate({ open: !state.open })}
            >
                <span className="text-sm text-brand-text font-medium leading-snug">{item.label}</span>
                {state.open ? (
                    <ChevronUp className="h-4 w-4 text-brand-text2 flex-shrink-0 mt-0.5" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-brand-text2 flex-shrink-0 mt-0.5" />
                )}
            </button>

            {state.open && (
                <div className="mt-2 space-y-2 pl-1">
                    {item.bewertungstyp === "BOOLEAN_MIT_BELEGE" && (
                        <div className="flex gap-2">
                            {[true, false].map((val) => (
                                <button
                                    key={String(val)}
                                    disabled={disabled}
                                    onClick={() => onUpdate({ bewertungBool: state.bewertungBool === val ? null : val })}
                                    className={`rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                                        state.bewertungBool === val
                                            ? val
                                                ? "bg-red-50 border-red-400 text-red-700"
                                                : "bg-emerald-50 border-emerald-400 text-emerald-700"
                                            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                    }`}
                                >
                                    {val ? "Ja – trifft zu" : "Nein – trifft nicht zu"}
                                </button>
                            ))}
                        </div>
                    )}

                    {item.bewertungstyp === "SECHSSTUFEN" && (
                        <div className="flex flex-wrap gap-1.5">
                            {SECHSSTUFEN.map((stufe) => (
                                <button
                                    key={stufe}
                                    disabled={disabled}
                                    onClick={() =>
                                        onUpdate({ bewertungStufe: state.bewertungStufe === stufe ? null : stufe })
                                    }
                                    className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                                        state.bewertungStufe === stufe
                                            ? SECHSSTUFEN_ACTIVE[stufe]
                                            : "border-brand-border/40 bg-white text-brand-text2 hover:border-brand-primary/40"
                                    }`}
                                >
                                    {SECHSSTUFEN_LABELS[stufe]}
                                </button>
                            ))}
                        </div>
                    )}

                    <Textarea
                        value={state.belege}
                        onChange={(e) => onUpdate({ belege: e.target.value })}
                        placeholder="Belege / Beobachtungen dokumentieren…"
                        rows={2}
                        className="text-xs"
                        disabled={disabled}
                    />
                </div>
            )}
        </div>
    );
}
