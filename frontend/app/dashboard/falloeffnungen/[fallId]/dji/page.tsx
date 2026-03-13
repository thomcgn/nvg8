"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    djiApi,
    type DjiAssessmentListItem,
    GESAMT_TONE,
} from "@/lib/api/dji";
import { ArrowLeft, Plus, ChevronRight, ClipboardList } from "lucide-react";

export default function DjiListPage() {
    const { fallId } = useParams<{ fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [items, setItems]     = useState<DjiAssessmentListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState<string | null>(null);

    useEffect(() => {
        if (!fid) return;
        setLoading(true);
        djiApi
            .list(fid)
            .then(setItems)
            .catch(() => setErr("Prüfbögen konnten nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="DJI-Prüfbögen" />

                <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>
                        <Button
                            className="gap-2"
                            onClick={() =>
                                router.push(`/dashboard/falloeffnungen/${fid}/dji/neu`)
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Neuer Prüfbogen
                        </Button>
                    </div>

                    {/* Titel */}
                    <div className="flex items-center gap-3 px-1">
                        <ClipboardList className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                DJI-Prüfbögen nach §8a SGB VIII
                            </div>
                            <div className="text-xs text-brand-text2">
                                Kindler et al. – Strukturierte klinische Einschätzungsinstrumente
                            </div>
                            <div className="text-xs text-brand-text2 mt-0.5">
                                {loading
                                    ? "Lade…"
                                    : `${items.length} Prüfbogen${items.length !== 1 ? "bögen" : ""}`}
                            </div>
                        </div>
                    </div>

                    {err && (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    )}

                    {!loading && items.length === 0 && !err && (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-brand-text2">
                                Noch kein Prüfbogen ausgefüllt.
                                <div className="mt-3">
                                    <Button
                                        onClick={() =>
                                            router.push(`/dashboard/falloeffnungen/${fid}/dji/neu`)
                                        }
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ersten Prüfbogen erstellen
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-3">
                        {items.map((item) => (
                            <AssessmentCard
                                key={item.id}
                                item={item}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/falloeffnungen/${fid}/dji/${item.id}`
                                    )
                                }
                            />
                        ))}
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}

function AssessmentCard({
    item,
    onClick,
}: {
    item: DjiAssessmentListItem;
    onClick: () => void;
}) {
    const toneClass = item.gesamteinschaetzung
        ? (GESAMT_TONE[item.gesamteinschaetzung] ?? "text-brand-text2")
        : "text-brand-text2";

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl border border-brand-border/40 bg-white p-4 hover:border-brand-primary/40 hover:shadow-sm transition-all"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-brand-text">
                            {new Date(item.bewertungsdatum).toLocaleDateString("de-DE")}
                        </span>
                        <Badge tone="neutral" className="text-xs">
                            {item.formTypLabel}
                        </Badge>
                    </div>

                    {item.gesamteinschaetzungLabel && (
                        <div className={`text-xs font-semibold ${toneClass}`}>
                            {item.gesamteinschaetzungLabel}
                        </div>
                    )}

                    <div className="text-xs text-brand-text2">
                        Erstellt von {item.createdByDisplayName}
                    </div>
                </div>
                <ChevronRight className="h-4 w-4 text-brand-text2 mt-0.5 flex-shrink-0" />
            </div>
        </button>
    );
}
