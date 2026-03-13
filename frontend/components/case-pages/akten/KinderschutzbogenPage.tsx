"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    kinderschutzbogenApi,
    type KinderschutzbogenListItem,
    RATING_LABELS,
    RATING_ACTIVE,
    autoScoreTone,
} from "@/lib/api/kinderschutzbogen";
import { ArrowLeft, Plus, ChevronRight, Shield } from "lucide-react";

export default function KinderschutzbogenListPage() {
    const { akteId, fallId } = useParams<{ akteId: string; fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [items, setItems] = useState<KinderschutzbogenListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!fid) return;
        setLoading(true);
        kinderschutzbogenApi
            .list(fid)
            .then(setItems)
            .catch(() => setErr("Assessments konnten nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Kinderschutzbogen" />

                <div className="mx-auto w-full max-w-4xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="ghost"
                            className="gap-2 text-brand-text2"
                            onClick={() => router.push(`/dashboard/akten/${akteId}`)}
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        <Button
                            className="gap-2"
                            onClick={() =>
                                router.push(`/dashboard/akten/${akteId}/${fid}/kinderschutzbogen/neu`)
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Neues Assessment
                        </Button>
                    </div>

                    {/* Titel */}
                    <div className="flex items-center gap-3 px-1">
                        <Shield className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                Stuttgarter Kinderschutzbogen
                            </div>
                            <div className="text-xs text-brand-text2">
                                {loading ? "Lade…" : `${items.length} Assessment${items.length !== 1 ? "s" : ""}`}
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
                                Noch kein Assessment vorhanden.
                                <div className="mt-3">
                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/akten/${akteId}/${fid}/kinderschutzbogen/neu`
                                            )
                                        }
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Erstes Assessment erstellen
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
                                        `/dashboard/akten/${akteId}/${fid}/kinderschutzbogen/${item.id}`
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
    item: KinderschutzbogenListItem;
    onClick: () => void;
}) {
    const manuell = item.gesamteinschaetzungManuell;
    const auto = item.gesamteinschaetzungAuto;

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
                            {item.altergruppeLabel}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                        {auto !== 0 && (
                            <div className="text-xs text-brand-text2">
                                Auto:{" "}
                                <span className={`font-semibold ${autoScoreTone(auto)}`}>
                                    {auto.toFixed(2)}
                                </span>
                            </div>
                        )}
                        {manuell !== null && manuell !== undefined && (
                            <div className="text-xs text-brand-text2">
                                Manuell:{" "}
                                <span
                                    className={`font-semibold inline-block px-2 py-0.5 rounded-full border text-xs ${RATING_ACTIVE[manuell]}`}
                                >
                                    {RATING_LABELS[manuell]}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-brand-text2">
                        Erstellt von {item.createdByDisplayName}
                    </div>
                </div>

                <ChevronRight className="h-4 w-4 text-brand-text2 mt-0.5 flex-shrink-0" />
            </div>
        </button>
    );
}
