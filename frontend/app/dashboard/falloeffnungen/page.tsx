"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungListResponse, FalleroeffnungListItem } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";

function statusTone(s: string): "success" | "info" | "warning" | "neutral" {
    const l = (s || "").toLowerCase();
    if (l.includes("abgesch")) return "success";
    if (l.includes("offen") || l.includes("neu")) return "info";
    if (l.includes("prüf") || l.includes("review")) return "warning";
    return "neutral";
}

function dringLabel(d: string | null | undefined): string | null {
    if (!d) return null;
    if (d === "AKUT_HEUTE") return "Heute";
    if (d === "ZEITNAH_24_48H") return "24–48 h";
    if (d === "BEOBACHTEN") return "Beobachten";
    return d;
}

function FallList() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const statusFilter = searchParams.get("status") ?? "";
    const [q, setQ] = useState("");
    const [page, setPage] = useState(0);
    const [data, setData] = useState<FalleroeffnungListResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const SIZE = 20;

    const load = useCallback(async (currentQ: string, currentPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (currentQ.trim()) params.set("q", currentQ.trim());
            if (statusFilter) params.set("status", statusFilter);
            params.set("page", String(currentPage));
            params.set("size", String(SIZE));

            const res = await apiFetch<FalleroeffnungListResponse>(
                `/falloeffnungen?${params.toString()}`
            );
            setData(res);
        } catch (e: any) {
            setError(e?.message || "Konnte Fälle nicht laden.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        setPage(0);
        load(q, 0);
    }, [statusFilter]); // eslint-disable-line

    useEffect(() => {
        load(q, page);
    }, [page]); // eslint-disable-line

    useEffect(() => {
        const t = setTimeout(() => {
            setPage(0);
            load(q, 0);
        }, 250);
        return () => clearTimeout(t);
    }, [q]); // eslint-disable-line

    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / SIZE));

    const title = statusFilter
        ? `Fälle – ${statusFilter === "ABGESCHLOSSEN" ? "Abgeschlossen" : statusFilter === "OFFEN" ? "Offen" : statusFilter}`
        : "Alle Fälle";

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={title} onSearch={setQ} />

                <div className="mx-auto w-full max-w-5xl px-4 pb-8 pt-4 sm:px-6">
                    {error && (
                        <div className="mb-4 rounded border border-brand-border bg-white px-4 py-3 text-sm text-brand-text">
                            {error}
                        </div>
                    )}

                    <Card>
                        <CardHeader className="flex items-center justify-between pb-2">
                            <span className="text-sm font-semibold text-brand-text">{title}</span>
                            <span className="text-xs text-brand-text2">
                                {loading ? "lädt…" : `${total} Einträge`}
                            </span>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-brand-border/60">
                                {!loading && items.length === 0 && (
                                    <div className="px-5 py-8 text-center text-sm text-brand-text2">
                                        {q.trim() ? "Keine Treffer für diese Suche." : "Keine Fälle vorhanden."}
                                    </div>
                                )}
                                {items.map((item: FalleroeffnungListItem) => {
                                    const dring = dringLabel((item as any).dringlichkeit);
                                    const isAkut = (item as any).akutGefahrImVerzug === true;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => router.push(`/dashboard/falloeffnungen/${item.id}`)}
                                            className="flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors hover:bg-brand-border/20 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-border"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                                    <span className="text-sm font-semibold text-brand-text">
                                                        {item.aktenzeichen || `#${item.id}`}
                                                    </span>
                                                    <span className="text-sm text-brand-text2">
                                                        {item.kindName || "—"}
                                                    </span>
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <Badge tone={statusTone(item.status)} className="text-xs">
                                                        {item.status}
                                                    </Badge>
                                                    {dring && (
                                                        <Badge tone={dring === "Heute" ? "danger" : "warning"} className="text-xs">
                                                            {dring}
                                                        </Badge>
                                                    )}
                                                    {isAkut && (
                                                        <Badge tone="danger" className="text-xs">Gefahr im Verzug</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <span className="text-xs text-brand-text2">
                                                    {item.createdAt
                                                        ? new Date(item.createdAt).toLocaleDateString("de-DE", {
                                                            day: "2-digit", month: "2-digit", year: "2-digit",
                                                        })
                                                        : "—"}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between border-t border-brand-border/60 px-5 py-3">
                                    <button
                                        disabled={page === 0}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="inline-flex items-center gap-1 rounded border border-brand-border px-3 py-1.5 text-xs text-brand-text2 transition hover:bg-brand-border/20 disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" /> Zurück
                                    </button>
                                    <span className="text-xs text-brand-text2">
                                        Seite {page + 1} / {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages - 1}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="inline-flex items-center gap-1 rounded border border-brand-border px-3 py-1.5 text-xs text-brand-text2 transition hover:bg-brand-border/20 disabled:opacity-40"
                                    >
                                        Weiter <ChevronRight className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}

export default function FalloeffnungenPage() {
    return (
        <Suspense>
            <FallList />
        </Suspense>
    );
}
