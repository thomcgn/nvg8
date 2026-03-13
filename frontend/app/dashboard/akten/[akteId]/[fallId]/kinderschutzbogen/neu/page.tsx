"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    kinderschutzbogenApi,
    type KatalogItem,
    type KatalogResponse,
    RATINGS,
    RATING_LABELS,
    RATING_ACTIVE,
    RATING_INACTIVE,
    autoScoreTone,
    autoScoreLabel,
} from "@/lib/api/kinderschutzbogen";
import { ArrowLeft, Info, Save } from "lucide-react";
import { toast } from "sonner";

type Bewertungen = Record<string, { rating: number | null; notiz: string }>;

export default function KinderschutzbogenNeuPage() {
    const { akteId, fallId } = useParams<{ akteId: string; fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [katalog, setKatalog] = useState<KatalogResponse | null>(null);
    const [loadingKatalog, setLoadingKatalog] = useState(true);
    const [katalogErr, setKatalogErr] = useState<string | null>(null);

    const [bewertungen, setBewertungen] = useState<Bewertungen>({});
    const [bewertungsdatum, setBewertungsdatum] = useState<string>(
        new Date().toISOString().split("T")[0]
    );
    const [gesamtManuell, setGesamtManuell] = useState<number | null>(null);
    const [gesamtFreitext, setGesamtFreitext] = useState("");
    const [saving, setSaving] = useState(false);

    // Katalog laden
    useEffect(() => {
        if (!fid) return;
        setLoadingKatalog(true);
        kinderschutzbogenApi
            .katalog(fid)
            .then((k) => {
                setKatalog(k);
                // Alle Items mit null initialisieren
                const init: Bewertungen = {};
                k.items.forEach((i) => {
                    init[i.code] = { rating: null, notiz: "" };
                });
                setBewertungen(init);
            })
            .catch(() => setKatalogErr("Katalog konnte nicht geladen werden."))
            .finally(() => setLoadingKatalog(false));
    }, [fid]);

    // Auto-Score live berechnen
    const autoScore = useMemo(() => {
        const rated = Object.values(bewertungen).filter((b) => b.rating !== null);
        if (rated.length === 0) return null;
        const sum = rated.reduce((acc, b) => acc + (b.rating ?? 0), 0);
        return Math.round((sum / rated.length) * 100) / 100;
    }, [bewertungen]);

    const setRating = useCallback((code: string, rating: number | null) => {
        setBewertungen((prev) => ({
            ...prev,
            [code]: { ...prev[code], rating },
        }));
    }, []);

    const setNotiz = useCallback((code: string, notiz: string) => {
        setBewertungen((prev) => ({
            ...prev,
            [code]: { ...prev[code], notiz },
        }));
    }, []);

    async function handleSave() {
        if (!fid || !katalog) return;
        setSaving(true);
        try {
            const req = {
                bewertungsdatum,
                bewertungen: Object.entries(bewertungen).map(([itemCode, b]) => ({
                    itemCode,
                    rating: b.rating,
                    notiz: b.notiz || null,
                })),
                gesamteinschaetzungManuell: gesamtManuell,
                gesamteinschaetzungFreitext: gesamtFreitext || null,
            };
            const result = await kinderschutzbogenApi.create(fid, req);
            toast.success("Assessment gespeichert.");
            router.push(`/dashboard/akten/${akteId}/${fid}/kinderschutzbogen/${result.id}`);
        } catch {
            toast.error("Speichern fehlgeschlagen.");
        } finally {
            setSaving(false);
        }
    }

    // Items nach Bereich gruppieren
    const bereiche = useMemo(() => {
        if (!katalog) return [];
        const map = new Map<string, { label: string; items: KatalogItem[] }>();
        katalog.items.forEach((item) => {
            if (!map.has(item.bereich)) {
                map.set(item.bereich, { label: item.bereichLabel, items: [] });
            }
            map.get(item.bereich)!.items.push(item);
        });
        return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
    }, [katalog]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Kinderschutzbogen · Neu" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <Button variant="ghost" className="gap-2 text-brand-text2" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>
                    </div>

                    {katalogErr && (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {katalogErr}
                        </div>
                    )}

                    {loadingKatalog && (
                        <div className="text-sm text-brand-text2 px-1">Katalog wird geladen…</div>
                    )}

                    {katalog && (
                        <>
                            {/* Metadaten */}
                            <Card>
                                <CardHeader>
                                    <div className="text-sm font-semibold text-brand-text">Angaben</div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-brand-text2 block mb-1">
                                            Bewertungsdatum
                                        </label>
                                        <input
                                            type="date"
                                            value={bewertungsdatum}
                                            onChange={(e) => setBewertungsdatum(e.target.value)}
                                            className="border border-brand-border/40 rounded-xl px-3 py-2 text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
                                        />
                                    </div>
                                    <div className="text-xs text-brand-text2">
                                        Altersgruppe:{" "}
                                        <span className="font-semibold text-brand-text">
                                            {katalog.altergruppeLabel}
                                        </span>
                                        <span className="ml-1 text-brand-text2">
                                            (berechnet aus Geburtsdatum und heutigem Datum)
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Bewertungsbereiche */}
                            {bereiche.map((bereich) => (
                                <Card key={bereich.key}>
                                    <CardHeader>
                                        <div className="text-sm font-semibold text-brand-text">
                                            {bereich.label}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {bereich.items.map((item) => (
                                            <ItemRow
                                                key={item.code}
                                                item={item}
                                                rating={bewertungen[item.code]?.rating ?? null}
                                                notiz={bewertungen[item.code]?.notiz ?? ""}
                                                onRating={(r) => setRating(item.code, r)}
                                                onNotiz={(n) => setNotiz(item.code, n)}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}

                            {/* Gesamteinschätzung */}
                            <Card>
                                <CardHeader>
                                    <div className="text-sm font-semibold text-brand-text">
                                        Gesamteinschätzung
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    {/* Auto-Score */}
                                    <div className="rounded-2xl border border-brand-border/30 bg-brand-bg p-4 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-brand-text2" />
                                            <span className="text-xs font-semibold text-brand-text2">
                                                Automatische Berechnung (nur Orientierung)
                                            </span>
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
                                        <div className="text-xs text-brand-text2">
                                            Hinweis: Die automatische Berechnung ist eine rechnerische Hilfe und
                                            ersetzt keine fachliche Beurteilung durch die Fachkraft.
                                        </div>
                                    </div>

                                    {/* Manuelle Gesamteinschätzung */}
                                    <div>
                                        <div className="text-xs font-semibold text-brand-text2 mb-2">
                                            Manuelle Gesamteinschätzung (optional)
                                        </div>
                                        <RatingButtons
                                            value={gesamtManuell}
                                            onChange={setGesamtManuell}
                                        />
                                    </div>

                                    {/* Freitext */}
                                    <div>
                                        <div className="text-xs font-semibold text-brand-text2 mb-2">
                                            Begründung / Freitext
                                        </div>
                                        <Textarea
                                            value={gesamtFreitext}
                                            onChange={(e) => setGesamtFreitext(e.target.value)}
                                            placeholder="Fachliche Einschätzung, Begründung, Besonderheiten…"
                                            rows={4}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Speichern */}
                            <div className="flex justify-end">
                                <Button className="gap-2 h-11" onClick={handleSave} disabled={saving}>
                                    <Save className="h-4 w-4" />
                                    {saving ? "Wird gespeichert…" : "Assessment speichern"}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </AuthGate>
    );
}

/* ─── ItemRow ─────────────────────────────────────────────────────────────── */

function ItemRow({
    item,
    rating,
    notiz,
    onRating,
    onNotiz,
}: {
    item: KatalogItem;
    rating: number | null;
    notiz: string;
    onRating: (r: number | null) => void;
    onNotiz: (n: string) => void;
}) {
    const [showNotiz, setShowNotiz] = useState(false);

    return (
        <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-brand-text min-w-0 sm:max-w-[55%]">{item.label}</div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    <RatingButtons value={rating} onChange={onRating} />
                    <button
                        type="button"
                        onClick={() => setShowNotiz((v) => !v)}
                        className="ml-2 text-xs text-brand-text2 hover:text-brand-text underline underline-offset-2"
                    >
                        {showNotiz ? "Notiz ausblenden" : "Notiz"}
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
                />
            )}
        </div>
    );
}

/* ─── RatingButtons ───────────────────────────────────────────────────────── */

function RatingButtons({
    value,
    onChange,
}: {
    value: number | null;
    onChange: (r: number | null) => void;
}) {
    return (
        <div className="flex gap-1">
            {RATINGS.map((r) => {
                const active = value === r;
                return (
                    <button
                        key={r}
                        type="button"
                        title={RATING_LABELS[r]}
                        onClick={() => onChange(active ? null : r)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                            active ? RATING_ACTIVE[r] : RATING_INACTIVE[r]
                        }`}
                    >
                        {r > 0 ? `+${r}` : r}
                    </button>
                );
            })}
        </div>
    );
}
