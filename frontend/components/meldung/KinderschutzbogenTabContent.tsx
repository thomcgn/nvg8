"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import {
    type KatalogResponse,
    type KatalogItem,
    RATINGS,
    RATING_LABELS,
    RATING_ACTIVE,
    RATING_INACTIVE,
    autoScoreLabel,
    autoScoreTone,
} from "@/lib/api/kinderschutzbogen";

export interface KinderschutzbogenState {
    bewertungsdatum: string;
    bewertungen: Record<string, { rating: number | null; notiz: string }>;
    gesamteinschaetzungManuell: number | null;
    gesamteinschaetzungFreitext: string;
}

export function defaultKinderschutzbogenState(): KinderschutzbogenState {
    return {
        bewertungsdatum: new Date().toISOString().split("T")[0],
        bewertungen: {},
        gesamteinschaetzungManuell: null,
        gesamteinschaetzungFreitext: "",
    };
}

interface Props {
    katalog: KatalogResponse | null;
    katalogLoading: boolean;
    form: KinderschutzbogenState;
    onChange: (form: KinderschutzbogenState) => void;
    disabled?: boolean;
}

export function KinderschutzbogenTabContent({ katalog, katalogLoading, form, onChange, disabled }: Props) {
    const bereiche = useMemo(() => {
        if (!katalog) return [];
        const map = new Map<string, { label: string; items: KatalogItem[] }>();
        katalog.items.forEach((item) => {
            if (!map.has(item.bereich)) map.set(item.bereich, { label: item.bereichLabel, items: [] });
            map.get(item.bereich)!.items.push(item);
        });
        return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
    }, [katalog]);

    const autoScore = useMemo(() => {
        const rated = Object.values(form.bewertungen).filter((b) => b.rating !== null);
        if (rated.length === 0) return null;
        const sum = rated.reduce((acc, b) => acc + (b.rating ?? 0), 0);
        return Math.round((sum / rated.length) * 100) / 100;
    }, [form.bewertungen]);

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
                    <CardTitle className="text-base font-semibold text-brand-text">Angaben</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-brand-text2 block mb-1">Bewertungsdatum</label>
                        <input
                            type="date"
                            value={form.bewertungsdatum}
                            onChange={(e) => onChange({ ...form, bewertungsdatum: e.target.value })}
                            disabled={disabled}
                            className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                        />
                    </div>
                    <div className="text-xs text-brand-text2">
                        Altersgruppe: <span className="font-semibold text-brand-text">{katalog.altergruppeLabel}</span>
                        <span className="ml-1">(aus Geburtsdatum berechnet)</span>
                    </div>
                </CardContent>
            </Card>

            {bereiche.map((bereich) => (
                <Card key={bereich.key} className="border border-brand-border/40 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-brand-text">{bereich.label}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {bereich.items.map((item) => (
                            <ItemRow
                                key={item.code}
                                item={item}
                                rating={form.bewertungen[item.code]?.rating ?? null}
                                notiz={form.bewertungen[item.code]?.notiz ?? ""}
                                onRating={(r) =>
                                    onChange({
                                        ...form,
                                        bewertungen: { ...form.bewertungen, [item.code]: { ...form.bewertungen[item.code], rating: r } },
                                    })
                                }
                                onNotiz={(n) =>
                                    onChange({
                                        ...form,
                                        bewertungen: { ...form.bewertungen, [item.code]: { ...form.bewertungen[item.code], notiz: n } },
                                    })
                                }
                                disabled={disabled}
                            />
                        ))}
                    </CardContent>
                </Card>
            ))}

            <Card className="border border-brand-border/40 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-brand-text">Gesamteinschätzung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-2xl border border-brand-border/30 bg-brand-bg p-4 space-y-1">
                        <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-brand-text2" />
                            <span className="text-xs font-semibold text-brand-text2">Automatische Berechnung (nur Orientierung)</span>
                        </div>
                        <div className="text-sm text-brand-text">
                            Durchschnitt:{" "}
                            {autoScore !== null ? (
                                <span className={`font-semibold ${autoScoreTone(autoScore)}`}>
                                    {autoScore.toFixed(2)} – {autoScoreLabel(autoScore)}
                                </span>
                            ) : (
                                <span className="text-brand-text2">noch keine Bewertungen</span>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-brand-text2 mb-2">Manuelle Gesamteinschätzung (optional)</div>
                        <div className="flex gap-1">
                            {RATINGS.map((r) => {
                                const active = form.gesamteinschaetzungManuell === r;
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        title={RATING_LABELS[r]}
                                        disabled={disabled}
                                        onClick={() => onChange({ ...form, gesamteinschaetzungManuell: active ? null : r })}
                                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
                                            active ? RATING_ACTIVE[r] : RATING_INACTIVE[r]
                                        }`}
                                    >
                                        {r > 0 ? `+${r}` : r}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <div className="text-xs font-semibold text-brand-text2 mb-2">Begründung / Freitext</div>
                        <Textarea
                            value={form.gesamteinschaetzungFreitext}
                            onChange={(e) => onChange({ ...form, gesamteinschaetzungFreitext: e.target.value })}
                            placeholder="Fachliche Einschätzung, Begründung, Besonderheiten…"
                            rows={4}
                            disabled={disabled}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function ItemRow({
    item,
    rating,
    notiz,
    onRating,
    onNotiz,
    disabled,
}: {
    item: KatalogItem;
    rating: number | null;
    notiz: string;
    onRating: (r: number | null) => void;
    onNotiz: (n: string) => void;
    disabled?: boolean;
}) {
    const [showNotiz, setShowNotiz] = React.useState(false);

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-brand-text min-w-0 sm:max-w-[55%]">{item.label}</div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex gap-1">
                        {RATINGS.map((r) => {
                            const active = rating === r;
                            return (
                                <button
                                    key={r}
                                    type="button"
                                    title={RATING_LABELS[r]}
                                    disabled={disabled}
                                    onClick={() => onRating(active ? null : r)}
                                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 ${
                                        active ? RATING_ACTIVE[r] : RATING_INACTIVE[r]
                                    }`}
                                >
                                    {r > 0 ? `+${r}` : r}
                                </button>
                            );
                        })}
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowNotiz((v) => !v)}
                        className="ml-2 text-xs text-brand-text2 hover:text-brand-text underline underline-offset-2"
                    >
                        {showNotiz ? "ausblenden" : "Notiz"}
                    </button>
                </div>
            </div>
            {showNotiz && (
                <Textarea
                    value={notiz}
                    onChange={(e) => onNotiz(e.target.value)}
                    placeholder="Notiz zu diesem Item…"
                    rows={2}
                    className="text-sm"
                    disabled={disabled}
                />
            )}
        </div>
    );
}
