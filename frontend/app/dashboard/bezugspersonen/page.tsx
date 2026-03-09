"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Users, RefreshCw, ChevronRight, Phone, Mail, Baby, Plus } from "lucide-react";

type KindMini = {
    id: number;
    displayName: string;
    geburtsdatum: string | null;
};

type BezugspersonListItem = {
    id: number;
    displayName: string;
    geburtsdatum: string | null;
    telefon: string | null;
    kontaktEmail: string | null;
    kinder?: KindMini[];
};

type BezugspersonSearchResponse = {
    items: BezugspersonListItem[];
    total: number;
    page: number;
    size: number;
};

function fmtGeb(d?: string | null) {
    if (!d) return null;
    return `geb. ${d}`;
}

export default function BezugspersonenPage() {
    const router = useRouter();

    const [q, setQ] = React.useState("");
    const [page, setPage] = React.useState(0);
    const [size] = React.useState(10);

    const [data, setData] = React.useState<BezugspersonSearchResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    const load = React.useCallback(
        async (currentQ?: string, currentPage?: number) => {
            setLoading(true);
            setErr(null);
            try {
                const params = new URLSearchParams();
                const qq = (currentQ ?? q).trim();
                const pp = currentPage ?? page;
                if (qq) params.set("q", qq);
                params.set("page", String(pp));
                params.set("size", String(size));

                const res = await apiFetch<BezugspersonSearchResponse>(
                    `/bezugspersonen?${params.toString()}`,
                    { method: "GET" }
                );
                setData(res);
            } catch (e: any) {
                setErr(e?.message || "Konnte Bezugspersonen nicht laden.");
                setData(null);
            } finally {
                setLoading(false);
            }
        },
        [page, q, size]
    );

    React.useEffect(() => {
        load();
    }, [load]);

    React.useEffect(() => {
        const t = setTimeout(() => {
            load(q, 0);
            setPage(0);
        }, 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const items = data?.items ?? [];
    const totalLabel = loading ? "…" : `${data?.total ?? items.length} Einträge`;

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Bezugspersonen" onSearch={(val) => setQ(val)} />

                <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    {/* Header card */}
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0">
                                <Users className="h-5 w-5 text-brand-text2 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-base font-semibold text-brand-text truncate">Bezugspersonen</div>
                                    <div className="mt-1 text-sm text-brand-text2 truncate">{totalLabel}</div>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button
                                    variant="secondary"
                                    onClick={() => load()}
                                    disabled={loading}
                                    className="gap-2 h-11 flex-1 sm:flex-none justify-center"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Aktualisieren
                                </Button>
                                <Link href="/dashboard/bezugspersonen/neu" className="flex-1 sm:flex-none">
                                    <Button className="gap-2 h-11 w-full justify-center">
                                        <Plus className="h-4 w-4" />
                                        Neu anlegen
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* List card */}
                    <Card className="border border-brand-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="text-sm font-semibold text-brand-text">Liste</div>
                            <div className="text-xs text-brand-text2">{totalLabel}</div>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            {!items.length ? (
                                <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                    {q.trim()
                                        ? "Keine Bezugspersonen zu dieser Suche gefunden."
                                        : "Noch keine Bezugspersonen vorhanden."}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {items.map((bp) => {
                                        const kinder = bp.kinder ?? [];
                                        return (
                                            <button
                                                key={bp.id}
                                                onClick={() => router.push(`/dashboard/bezugspersonen/${bp.id}`)}
                                                className="w-full rounded-2xl border border-brand-border/25 bg-white p-3 text-left transition hover:bg-brand-bg/30"
                                            >
                                                {/* Name + Chevron */}
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className="truncate text-sm font-semibold text-brand-text">
                                                                {bp.displayName || `Bezugsperson #${bp.id}`}
                                                            </div>
                                                            <ChevronRight className="h-4 w-4 text-brand-text2 shrink-0" />
                                                        </div>
                                                        {fmtGeb(bp.geburtsdatum) && (
                                                            <div className="mt-0.5 text-xs text-brand-text2">
                                                                {fmtGeb(bp.geburtsdatum)}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Telefon Badge */}
                                                    {bp.telefon ? (
                                                        <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-brand-border/40 bg-brand-bg px-3 py-1">
                                                            <Phone className="h-3.5 w-3.5 text-brand-text2" />
                                                            <span className="text-xs font-medium text-brand-text tabular-nums">
                                                                {bp.telefon}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-brand-border/25 bg-white px-3 py-1">
                                                            <Phone className="h-3.5 w-3.5 text-brand-text2/50" />
                                                            <span className="text-xs text-brand-text2/50">kein Telefon</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                {bp.kontaktEmail && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-brand-text2">
                                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                                        <span className="truncate">{bp.kontaktEmail}</span>
                                                    </div>
                                                )}

                                                {/* Verknüpfte Kinder */}
                                                <div
                                                    className="mt-2.5 flex flex-wrap items-center gap-1.5"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center gap-1 text-xs text-brand-text2 mr-1">
                                                        <Baby className="h-3.5 w-3.5" />
                                                        <span>{kinder.length > 0 ? `${kinder.length} Kind${kinder.length !== 1 ? "er" : ""}` : "Keine Kinder"}</span>
                                                    </div>
                                                    {kinder.map((k) => (
                                                        <Link
                                                            key={k.id}
                                                            href={`/dashboard/kinder/${k.id}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="inline-flex items-center gap-1 rounded-full border border-brand-border/40 bg-brand-bg px-2.5 py-0.5 text-xs text-brand-text hover:bg-white transition"
                                                        >
                                                            <span className="font-medium">{k.displayName || `Kind #${k.id}`}</span>
                                                            {k.geburtsdatum && (
                                                                <span className="text-brand-text2">{k.geburtsdatum}</span>
                                                            )}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Pagination */}
                            <div className="mt-3 flex items-center justify-between">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setPage((p) => {
                                            const next = Math.max(0, p - 1);
                                            load(q, next);
                                            return next;
                                        });
                                    }}
                                    disabled={loading || page <= 0}
                                >
                                    Zurück
                                </Button>
                                <div className="text-xs text-brand-text2">Seite {page + 1}</div>
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setPage((p) => {
                                            const next = p + 1;
                                            load(q, next);
                                            return next;
                                        });
                                    }}
                                    disabled={loading || (data ? (page + 1) * size >= data.total : true)}
                                >
                                    Weiter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}