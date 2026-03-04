"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Phone, Mail, Baby } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

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

    // ✅ vom Backend ergänzt: verknüpfte Kinder (optional)
    kinder?: KindMini[];
};

type BezugspersonSearchResponse = {
    items: BezugspersonListItem[];
    total: number;
    page: number;
    size: number;
};

function fmtGeb(d?: string | null) {
    if (!d) return "—";
    return `geb. ${d}`;
}

function ChipLink({
                      href,
                      children,
                      className,
                  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
}) {
    // Link als "Chip" – stopPropagation sorgt dafür, dass nicht die Eltern-Card navigiert
    return (
        <Link
            href={href}
            onClick={(e) => e.stopPropagation()}
            className={
                className ??
                "inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-bg px-3 py-1 text-xs text-brand-text hover:bg-white"
            }
        >
            {children}
        </Link>
    );
}

export default function BezugspersonenPage() {
    const router = useRouter();
    const [q, setQ] = useState("");
    const [data, setData] = useState<BezugspersonSearchResponse | null>(null);
    const [loading, setLoading] = useState(false);

    async function load(query: string) {
        setLoading(true);
        try {
            const res = await apiFetch<BezugspersonSearchResponse>(
                `/bezugspersonen?q=${encodeURIComponent(query)}&page=0&size=30`,
                { method: "GET" }
            );
            setData(res);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(q), 250);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    const items = useMemo(() => data?.items ?? [], [data]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Bezugspersonen" onSearch={(val) => setQ(val)} />

                <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 md:px-8 space-y-4">
                    <div className="flex items-center justify-end">
                        <Link href="/dashboard/bezugspersonen/neu">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Bezugsperson anlegen
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-brand-text">Liste</div>
                            <div className="text-xs text-brand-text2">
                                {loading ? "lädt…" : `${data?.total ?? 0} Treffer`}
                            </div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                {items.map((bp) => {
                                    const kinder = bp.kinder ?? [];
                                    const hasKinder = kinder.length > 0;

                                    const go = () => router.push(`/dashboard/bezugspersonen/${bp.id}`);

                                    return (
                                        <div
                                            key={bp.id}
                                            role="link"
                                            tabIndex={0}
                                            onClick={go}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    go();
                                                }
                                            }}
                                            className="cursor-pointer rounded-2xl border border-brand-border bg-white p-3 hover:bg-brand-bg focus:outline-none focus:ring-2 focus:ring-brand-border"
                                        >
                                            {/* Header row */}
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold text-brand-blue whitespace-normal break-words">
                                                        {bp.displayName || `Bezugsperson #${bp.id}`}
                                                    </div>
                                                    <div className="mt-1 text-xs text-brand-text2">{fmtGeb(bp.geburtsdatum)}</div>
                                                </div>

                                                {/* Phone highlight */}
                                                <div className="shrink-0">
                                                    {bp.telefon ? (
                                                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-brand-bg px-3 py-1">
                                                            <Phone className="h-4 w-4 text-brand-text2" />
                                                            <span className="text-sm font-semibold text-brand-text tabular-nums">
                                {bp.telefon}
                              </span>
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 rounded-full border border-brand-border bg-white px-3 py-1">
                                                            <Phone className="h-4 w-4 text-brand-text2" />
                                                            <span className="text-xs text-brand-text2">kein Telefon</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Email */}
                                            {bp.kontaktEmail ? (
                                                <div className="mt-2 flex items-center gap-2 text-xs text-brand-text2">
                                                    <Mail className="h-4 w-4" />
                                                    <span className="break-words">{bp.kontaktEmail}</span>
                                                </div>
                                            ) : null}

                                            {/* Linked kids */}
                                            <div
                                                className="mt-3 rounded-2xl border border-brand-border bg-white p-3"
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            >
                                                <div className="flex items-center gap-2 text-xs font-semibold text-brand-text">
                                                    <Baby className="h-4 w-4 text-brand-text2" />
                                                    Verknüpfte Kinder
                                                    {hasKinder ? (
                                                        <span className="ml-1 text-xs font-normal text-brand-text2">({kinder.length})</span>
                                                    ) : null}
                                                </div>

                                                {hasKinder ? (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {kinder.map((k) => (
                                                            <ChipLink key={k.id} href={`/dashboard/kinder/${k.id}`}>
                                <span className="font-semibold text-brand-blue">
                                  {k.displayName || `Kind #${k.id}`}
                                </span>
                                                                <span className="text-brand-text2">{fmtGeb(k.geburtsdatum)}</span>
                                                            </ChipLink>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-xs text-brand-text2">Keine verknüpften Kinder.</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {!items.length ? (
                                    <div className="rounded-2xl border border-brand-border bg-brand-bg p-4 text-sm text-brand-text2">
                                        Keine Bezugspersonen gefunden.
                                    </div>
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}