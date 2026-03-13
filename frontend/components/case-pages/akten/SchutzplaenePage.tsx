"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    schutzplanApi,
    type SchutzplanListItem,
    SCHUTZPLAN_STATUS_LABELS,
} from "@/lib/api/schutzplan";
import { ArrowLeft, Plus, ChevronRight, ShieldCheck } from "lucide-react";

export default function SchutzplaeneListPage() {
    const { akteId, fallId } = useParams<{ akteId: string; fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [items, setItems]     = useState<SchutzplanListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState<string | null>(null);

    useEffect(() => {
        if (!fid) return;
        setLoading(true);
        schutzplanApi
            .list(fid)
            .then((data) => {
                const sorted = [...data].sort(
                    (a, b) =>
                        new Date(b.erstelltAm).getTime() -
                        new Date(a.erstelltAm).getTime()
                );
                setItems(sorted);
            })
            .catch(() => setErr("Schutzpläne konnten nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Schutzplanung" />

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
                                router.push(`/dashboard/akten/${akteId}/${fid}/schutzplaene/neu`)
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Neuer Schutzplan
                        </Button>
                    </div>

                    {/* Titel */}
                    <div className="flex items-center gap-3 px-1">
                        <ShieldCheck className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                Schutzplanung
                            </div>
                            <div className="text-xs text-brand-text2 mt-0.5">
                                {loading
                                    ? "Lade…"
                                    : `${items.length} Schutzplan${items.length !== 1 ? "pläne" : ""}`}
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
                                Noch kein Schutzplan erstellt.
                                <div className="mt-3">
                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/akten/${akteId}/${fid}/schutzplaene/neu`
                                            )
                                        }
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ersten Schutzplan erstellen
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-3">
                        {items.map((item) => (
                            <SchutzplanCard
                                key={item.id}
                                item={item}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/akten/${akteId}/${fid}/schutzplaene/${item.id}`
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

function SchutzplanCard({
    item,
    onClick,
}: {
    item: SchutzplanListItem;
    onClick: () => void;
}) {
    const statusLabel = SCHUTZPLAN_STATUS_LABELS[item.status] ?? item.status;
    const statusClass =
        item.status === "AKTIV"
            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
            : "bg-gray-100 text-gray-600 border border-gray-200";

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl border border-brand-border/40 bg-white p-4 hover:border-brand-primary/40 hover:shadow-sm transition-all"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-brand-text">
                            {new Date(item.erstelltAm).toLocaleDateString("de-DE")}
                        </span>
                        <span
                            className={`text-xs rounded-full px-2 py-0.5 font-medium ${statusClass}`}
                        >
                            {statusLabel}
                        </span>
                    </div>

                    {item.gueltigBis && (
                        <div className="text-xs text-brand-text2">
                            Gültig bis{" "}
                            {new Date(item.gueltigBis).toLocaleDateString("de-DE")}
                        </div>
                    )}

                    <div className="text-xs text-brand-text2">
                        {item.anzahlMassnahmen} Maßnahme{item.anzahlMassnahmen !== 1 ? "n" : ""}
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
