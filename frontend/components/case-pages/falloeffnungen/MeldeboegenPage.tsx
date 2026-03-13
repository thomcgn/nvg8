"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    meldebogenApi,
    type MeldebogenListItem,
    ERSTEINSCHAETZUNG_LABELS,
    ERSTEINSCHAETZUNG_TONE,
    DRINGLICHKEIT_LABELS,
    MELDUNGART_LABELS,
} from "@/lib/api/meldebogen";
import { ArrowLeft, Plus, ChevronRight, FileSearch } from "lucide-react";

export default function MeldeboegenListPage() {
    const { fallId } = useParams<{ fallId: string }>();
    const router = useRouter();
    const fid = fallId ? Number(fallId) : null;

    const [items, setItems]     = useState<MeldebogenListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr]         = useState<string | null>(null);

    useEffect(() => {
        if (!fid) return;
        setLoading(true);
        meldebogenApi
            .list(fid)
            .then((data) => {
                const sorted = [...data].sort(
                    (a, b) =>
                        new Date(b.eingangsdatum).getTime() -
                        new Date(a.eingangsdatum).getTime()
                );
                setItems(sorted);
            })
            .catch(() => setErr("Meldebogen konnten nicht geladen werden."))
            .finally(() => setLoading(false));
    }, [fid]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Eingangserfassung (Meldebogen)" />

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
                                router.push(`/dashboard/falloeffnungen/${fid}/meldeboegen/neu`)
                            }
                        >
                            <Plus className="h-4 w-4" />
                            Neuer Meldebogen
                        </Button>
                    </div>

                    {/* Titel */}
                    <div className="flex items-center gap-3 px-1">
                        <FileSearch className="h-5 w-5 text-brand-text2" />
                        <div>
                            <div className="text-base font-semibold text-brand-text">
                                Eingangserfassung (Meldebogen)
                            </div>
                            <div className="text-xs text-brand-text2">
                                Strukturierte Ersterfassung von KWG-Meldungen
                            </div>
                            <div className="text-xs text-brand-text2 mt-0.5">
                                {loading
                                    ? "Lade…"
                                    : `${items.length} Meldebogen${items.length !== 1 ? "bögen" : ""}`}
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
                                Noch kein Meldebogen erfasst.
                                <div className="mt-3">
                                    <Button
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/falloeffnungen/${fid}/meldeboegen/neu`
                                            )
                                        }
                                        className="gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Ersten Meldebogen erstellen
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-3">
                        {items.map((item) => (
                            <MeldebogenCard
                                key={item.id}
                                item={item}
                                onClick={() =>
                                    router.push(
                                        `/dashboard/falloeffnungen/${fid}/meldeboegen/${item.id}`
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

function MeldebogenCard({
    item,
    onClick,
}: {
    item: MeldebogenListItem;
    onClick: () => void;
}) {
    const ersteinschaetzungLabel = item.ersteinschaetzung
        ? (ERSTEINSCHAETZUNG_LABELS[item.ersteinschaetzung] ?? item.ersteinschaetzung)
        : null;
    const ersteinschaetzungTone = item.ersteinschaetzung
        ? (ERSTEINSCHAETZUNG_TONE[item.ersteinschaetzung] ?? "text-brand-text2")
        : "text-brand-text2";
    const meldungartLabel = item.meldungart
        ? (MELDUNGART_LABELS[item.meldungart] ?? item.meldungart)
        : null;
    const dringlichkeitLabel = item.handlungsdringlichkeit
        ? (DRINGLICHKEIT_LABELS[item.handlungsdringlichkeit] ?? item.handlungsdringlichkeit)
        : null;

    return (
        <button
            onClick={onClick}
            className="w-full text-left rounded-2xl border border-brand-border/40 bg-white p-4 hover:border-brand-primary/40 hover:shadow-sm transition-all"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-brand-text">
                            {new Date(item.eingangsdatum).toLocaleDateString("de-DE")}
                        </span>
                        {meldungartLabel && (
                            <span className="text-xs rounded-full border border-brand-border/40 px-2 py-0.5 text-brand-text2">
                                {meldungartLabel}
                            </span>
                        )}
                    </div>

                    {ersteinschaetzungLabel && (
                        <div className={`text-xs font-semibold ${ersteinschaetzungTone}`}>
                            {ersteinschaetzungLabel}
                        </div>
                    )}

                    {dringlichkeitLabel && (
                        <div className="text-xs text-brand-text2">
                            Dringlichkeit: {dringlichkeitLabel}
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
