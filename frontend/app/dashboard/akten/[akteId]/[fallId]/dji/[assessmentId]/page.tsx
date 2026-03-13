"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    djiApi,
    type DjiAssessmentResponse,
    type DjiPositionResponse,
    GESAMT_TONE,
    SECHSSTUFEN_LABELS,
    SECHSSTUFEN_TONE,
} from "@/lib/api/dji";
import { ArrowLeft, Edit2 } from "lucide-react";

export default function DjiDetailPage() {
    const { akteId, fallId, assessmentId } = useParams<{
        akteId: string;
        fallId: string;
        assessmentId: string;
    }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;
    const aid = assessmentId ? Number(assessmentId) : null;

    const [assessment, setAssessment] = useState<DjiAssessmentResponse | null>(null);
    const [loading, setLoading]       = useState(true);
    const [err, setErr]               = useState<string | null>(null);

    useEffect(() => {
        if (!fid || !aid) return;
        setLoading(true);
        djiApi
            .get(fid, aid)
            .then(setAssessment)
            .catch(() => setErr("Prüfbogen konnte nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid, aid]);

    if (loading) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="DJI-Prüfbogen" />
                    <div className="p-8 text-center text-sm text-brand-text2">Lade…</div>
                </div>
            </AuthGate>
        );
    }

    if (err || !assessment) {
        return (
            <AuthGate>
                <div className="min-h-screen bg-brand-bg">
                    <Topbar title="DJI-Prüfbogen" />
                    <div className="p-6 text-sm text-brand-danger">{err ?? "Nicht gefunden."}</div>
                </div>
            </AuthGate>
        );
    }

    // Positionen nach Bereich gruppieren
    const gruppiertNachBereich = assessment.positionen.reduce<
        Record<string, DjiPositionResponse[]>
    >((acc, p) => {
        const key = p.bereich ?? "Kriterien";
        if (!acc[key]) acc[key] = [];
        acc[key].push(p);
        return acc;
    }, {});

    const gesamtTone = assessment.gesamteinschaetzung
        ? (GESAMT_TONE[assessment.gesamteinschaetzung] ?? "text-brand-text")
        : "text-brand-text";

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={assessment.formTypLabel} />

                <div className="mx-auto w-full max-w-3xl px-3 sm:px-6 pb-12 pt-4 space-y-5">
                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() =>
                                router.push(`/dashboard/akten/${akteId}/${fid}/dji`)
                            }
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Übersicht
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() =>
                                router.push(
                                    `/dashboard/akten/${akteId}/${fid}/dji/${aid}/bearbeiten`
                                )
                            }
                        >
                            <Edit2 className="h-4 w-4" />
                            Bearbeiten
                        </Button>
                    </div>

                    {/* Metadaten */}
                    <Card>
                        <CardContent className="pt-4 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-base font-semibold text-brand-text">
                                    {new Date(assessment.bewertungsdatum).toLocaleDateString("de-DE")}
                                </span>
                                <Badge tone="neutral">{assessment.formTypLabel}</Badge>
                            </div>
                            <div className="text-xs text-brand-text2">
                                Erstellt von {assessment.createdByDisplayName} ·{" "}
                                {new Date(assessment.createdAt).toLocaleDateString("de-DE")}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Positionen */}
                    {Object.entries(gruppiertNachBereich).map(([bereich, positionen]) => (
                        <Card key={bereich}>
                            {bereich !== "Kriterien" && (
                                <CardHeader className="pb-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-brand-text2">
                                        {bereich}
                                    </div>
                                </CardHeader>
                            )}
                            <CardContent className="space-y-4">
                                {positionen.map((p) => (
                                    <PositionDetail key={p.positionCode} position={p} />
                                ))}
                            </CardContent>
                        </Card>
                    ))}

                    {/* Gesamteinschätzung */}
                    {(assessment.gesamteinschaetzung || assessment.gesamtfreitext) && (
                        <Card>
                            <CardHeader className="pb-2">
                                <div className="text-sm font-semibold text-brand-text">
                                    Gesamteinschätzung
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {assessment.gesamteinschaetzungLabel && (
                                    <div className={`text-sm font-semibold ${gesamtTone}`}>
                                        {assessment.gesamteinschaetzungLabel}
                                    </div>
                                )}
                                {assessment.gesamtfreitext && (
                                    <p className="text-sm text-brand-text whitespace-pre-wrap">
                                        {assessment.gesamtfreitext}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthGate>
    );
}

// ─── PositionDetail ───────────────────────────────────────────────────────────

function PositionDetail({ position }: { position: DjiPositionResponse }) {
    const hasBewertung =
        position.bewertungBool !== null ||
        position.bewertungStufe !== null;

    return (
        <div className="border-b border-brand-border/20 last:border-0 pb-4 last:pb-0 space-y-1.5">
            <div className="text-sm font-medium text-brand-text">
                {position.label}
            </div>

            {/* Boolean */}
            {position.bewertungstyp === "BOOLEAN_MIT_BELEGE" && hasBewertung && (
                <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        position.bewertungBool
                            ? "bg-red-50 border-red-300 text-red-700"
                            : "bg-emerald-50 border-emerald-300 text-emerald-700"
                    }`}
                >
                    {position.bewertungBool ? "Ja – trifft zu" : "Nein – trifft nicht zu"}
                </span>
            )}

            {/* Sechsstufen */}
            {position.bewertungstyp === "SECHSSTUFEN" &&
                position.bewertungStufe !== null &&
                position.bewertungStufe !== undefined && (
                    <span
                        className={`inline-block text-xs font-semibold ${SECHSSTUFEN_TONE[position.bewertungStufe]}`}
                    >
                        {SECHSSTUFEN_LABELS[position.bewertungStufe]}
                    </span>
                )}

            {/* Belege */}
            {position.belege && (
                <p className="text-xs text-brand-text2 whitespace-pre-wrap pl-1 border-l-2 border-brand-border/30">
                    {position.belege}
                </p>
            )}

            {!hasBewertung && !position.belege && (
                <span className="text-xs text-brand-text2 italic">Nicht ausgefüllt</span>
            )}
        </div>
    );
}
