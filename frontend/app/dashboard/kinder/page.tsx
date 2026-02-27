"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";

type KindListItem = {
    id: number;
    displayName: string;
    geburtsdatum: string | null;
    gender: string | null;
    foerderbedarf: boolean;
};

type KindSearchResponse = {
    items: KindListItem[];
    total: number;
    page: number;
    size: number;
};

export default function KinderPage() {
    const [q, setQ] = useState("");
    const [data, setData] = useState<KindSearchResponse | null>(null);
    const [loading, setLoading] = useState(false);

    async function load(query: string) {
        setLoading(true);
        try {
            const res = await apiFetch<KindSearchResponse>(`/kinder?q=${encodeURIComponent(query)}&page=0&size=30`, {
                method: "GET",
            });
            setData(res);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load("");
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(q), 250);
        return () => clearTimeout(t);
    }, [q]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Kinder" onSearch={(val) => setQ(val)} />

                <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 md:px-8 space-y-4">
                    <div className="flex items-center justify-end">
                        <Link href="/dashboard/kinder/neu">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Kind anlegen
                            </Button>
                        </Link>
                    </div>

                    <Card>
                        <CardHeader className="flex items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-brand-text">Liste</div>
                            </div>
                            <div className="text-xs text-brand-text2">{loading ? "lädt…" : `${data?.total ?? 0} Treffer`}</div>
                        </CardHeader>

                        <CardContent>
                            <div className="space-y-2">
                                {(data?.items || []).map((k) => (
                                    <Link
                                        key={k.id}
                                        href={`/dashboard/kinder/${k.id}`}
                                        className="block rounded-2xl border border-brand-border bg-white p-3 hover:bg-brand-bg"
                                    >
                                        <div className="text-sm font-semibold text-brand-blue wrap-break-word whitespace-normal">
                                            {k.displayName || `Kind #${k.id}`}
                                        </div>
                                        <div className="mt-1 text-xs text-brand-text2">
                                            {k.geburtsdatum ? `geb. ${k.geburtsdatum}` : "geb. —"} · {k.gender || "—"} ·{" "}
                                            {k.foerderbedarf ? "Förderbedarf" : "kein Förderbedarf"}
                                        </div>
                                    </Link>
                                ))}

                                {!data?.items?.length ? (
                                    <div className="rounded-2xl border border-brand-border bg-brand-bg p-4 text-sm text-brand-text2">
                                        Keine Kinder gefunden.
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