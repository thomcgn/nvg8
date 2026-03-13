"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    kinderschutzbogenApi,
    type KinderschutzbogenResponse,
    type BewertungResponse,
    RATING_LABELS,
    RATING_ACTIVE,
    autoScoreTone,
    autoScoreLabel,
} from "@/lib/api/kinderschutzbogen";
import { ArrowLeft, Info, Pencil } from "lucide-react";

const BEREICH_ORDER = [
    "GRUNDVERSORGUNG_SCHUTZ",
    "INTERAKTION",
    "KOOPERATION",
    "ERSCHEINUNGSBILD",
];

const BEREICH_LABELS: Record<string, string> = {
    GRUNDVERSORGUNG_SCHUTZ: "Grundversorgung und Schutz",
    INTERAKTION: "Interaktion Bezugsperson – Kind",
    KOOPERATION: "Kooperationsbereitschaft der Sorgeberechtigten",
    ERSCHEINUNGSBILD: "Erscheinungsbild des Jugendlichen",
};

export default function KinderschutzbogenDetailPage() {
    const { akteId, fallId, assessmentId } = useParams<{ akteId: string; fallId: string; assessmentId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;
    const aid = assessmentId ? Number(assessmentId) : null;

    const [data, setData] = useState<KinderschutzbogenResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!fid || !aid) return;
        setLoading(true);
        kinderschutzbogenApi
            .get(fid, aid)
            .then(setData)
            .catch(() => setErr("Assessment konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid, aid]);

    // Items nach Bereich gruppieren
    const bereiche = data
        ? BEREICH_ORDER.map((key) => ({
              key,
              label: BEREICH_LABELS[key] ?? key,
              items: data.bewertungen.filter((b) => b.bereich === key),
          })).filter((b) => b.items.length > 0)
        : [];

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Kinderschutzbogen · Detail" />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        {data && (
                            <Button
                                variant="secondary"
                                className="gap-2"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/akten/${akteId}/${fid}/kinderschutzbogen/${aid}/bearbeiten`
                                    )
                                }
                            >
                                <Pencil className="h-4 w-4" />
                                Bearbeiten
                            </Button>
                        )}
                    </div>

                    {err && (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    )}

                    {loading && (
                        <div className="text-sm text-brand-text2 px-1">Wird geladen…</div>
                    )}

                    {data && (
                        <>
                            {/* Kopfdaten */}
                            <Card>
                                <CardContent className="pt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                                    <MetaField
                                        label="Bewertungsdatum"
                                        value={new Date(data.bewertungsdatum).toLocaleDateString("de-DE")}
                                    />
                                    <MetaField label="Altersgruppe" value={data.altergruppeLabel} />
                                    <MetaField label="Erstellt von" value={data.createdByDisplayName} />
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
                                    <CardContent className="space-y-4">
                                        {bereich.items.map((b) => (
                                            <BewertungRow key={b.itemCode} b={b} />
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
                                <CardContent className="space-y-4">
                                    {/* Auto */}
                                    <div className="rounded-2xl border border-brand-border/30 bg-brand-bg p-4 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Info className="h-4 w-4 text-brand-text2" />
                                            <span className="text-xs font-semibold text-brand-text2">
                                                Automatische Berechnung (nur Orientierung)
                                            </span>
                                        </div>
                                        <div className="text-sm text-brand-text">
                                            {data.gesamteinschaetzungAuto !== 0 ? (
                                                <>
                                                    Durchschnitt:{" "}
                                                    <span
                                                        className={`font-semibold ${autoScoreTone(data.gesamteinschaetzungAuto)}`}
                                                    >
                                                        {data.gesamteinschaetzungAuto.toFixed(2)} –{" "}
                                                        {autoScoreLabel(data.gesamteinschaetzungAuto)}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-brand-text2">Keine Bewertungen vorhanden</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-brand-text2">
                                            Hinweis: Die automatische Berechnung ist eine rechnerische Hilfe und
                                            ersetzt keine fachliche Beurteilung durch die Fachkraft.
                                        </div>
                                    </div>

                                    {/* Manuell */}
                                    {data.gesamteinschaetzungManuell !== null &&
                                        data.gesamteinschaetzungManuell !== undefined && (
                                            <div>
                                                <div className="text-xs font-semibold text-brand-text2 mb-1">
                                                    Manuelle Gesamteinschätzung
                                                </div>
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full border text-sm font-semibold ${RATING_ACTIVE[data.gesamteinschaetzungManuell]}`}
                                                >
                                                    {RATING_LABELS[data.gesamteinschaetzungManuell]}
                                                </span>
                                            </div>
                                        )}

                                    {/* Freitext */}
                                    {data.gesamteinschaetzungFreitext && (
                                        <div>
                                            <div className="text-xs font-semibold text-brand-text2 mb-1">
                                                Begründung / Freitext
                                            </div>
                                            <div className="text-sm text-brand-text whitespace-pre-wrap rounded-xl border border-brand-border/30 bg-brand-bg p-3">
                                                {data.gesamteinschaetzungFreitext}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </AuthGate>
    );
}

/* ─── Hilfkomponenten ────────────────────────────────────────────────────── */

function MetaField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs font-semibold text-brand-text2">{label}</div>
            <div className="mt-0.5 text-sm text-brand-text">{value}</div>
        </div>
    );
}

function BewertungRow({ b }: { b: BewertungResponse }) {
    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-brand-text min-w-0">{b.itemLabel}</div>
                {b.rating !== null ? (
                    <span
                        className={`flex-shrink-0 inline-block px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${RATING_ACTIVE[b.rating]}`}
                    >
                        {b.rating > 0 ? `+${b.rating}` : b.rating} – {RATING_LABELS[b.rating]}
                    </span>
                ) : (
                    <span className="text-xs text-brand-text2 flex-shrink-0">nicht bewertet</span>
                )}
            </div>
            {b.notiz && (
                <div className="text-xs text-brand-text2 bg-brand-bg rounded-lg px-3 py-2">
                    {b.notiz}
                </div>
            )}
        </div>
    );
}
