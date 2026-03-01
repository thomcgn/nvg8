"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungResponse } from "@/lib/types";
import { FileText, RefreshCw, ArrowRight } from "lucide-react";

function toneForStatus(
    status: string
): "success" | "warning" | "danger" | "info" | "neutral" {
    const s = (status || "").toLowerCase();
    if (s.includes("hoch") || s.includes("krit") || s.includes("risiko")) return "danger";
    if (s.includes("warn") || s.includes("prüf") || s.includes("review")) return "warning";
    if (s.includes("abgesch") || s.includes("done") || s.includes("geschlossen")) return "success";
    if (s.includes("offen") || s.includes("neu")) return "info";
    return "neutral";
}

function errorMessage(e: unknown, fallback: string) {
    if (
        e &&
        typeof e === "object" &&
        "message" in e &&
        typeof (e as { message?: unknown }).message === "string"
    ) {
        return (e as { message: string }).message;
    }
    return fallback;
}

function safeNumber(v: unknown): number | null {
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    if (Array.isArray(v) && typeof v[0] === "string") {
        const n = Number(v[0]);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

export default function AkteDetailsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();

    const id = useMemo(() => safeNumber((params as any)?.id), [params]);

    const [data, setData] = useState<FalleroeffnungResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    // ✅ konsistent: autostart=meldungen
    const autostartMeldungen = searchParams?.get("autostart") === "meldungen";

    async function load() {
        if (!id) return;
        setErr(null);
        setLoading(true);
        try {
            const res = await apiFetch<FalleroeffnungResponse>(`/falloeffnungen/${id}`, {
                method: "GET",
            });
            setData(res);
        } catch (e: unknown) {
            setErr(errorMessage(e, "Konnte Fall nicht laden."));
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    function goMeldungen() {
        if (!id) return;
        // ✅ Route existiert bei dir (params heißt fallId)
        router.push(`/dashboard/falloeffnungen/${id}/meldungen`);
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ✅ Autostart: direkt zu Meldungen (statt 404 /erstmeldung)
    //    replace "verbraucht" das Query und verhindert Re-Trigger bei Back/Reload
    useEffect(() => {
        if (id && autostartMeldungen) {
            router.replace(`/dashboard/falloeffnungen/${id}/meldungen`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, autostartMeldungen]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Akte" />

                <div className="mx-auto w-full max-w-4xl px-4 pb-12 pt-4 sm:px-6 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    <Card>
                        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-brand-text2" />
                                <div>
                                    <div className="text-sm font-semibold text-brand-text">
                                        {data?.aktenzeichen ??
                                            (loading ? "Lade…" : id ? `Fall #${id}` : "Fall")}
                                    </div>
                                    <div className="mt-1 text-xs text-brand-text2">
                                        {data?.kindName ? `Kind: ${data.kindName}` : " "}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Button
                                    variant="secondary"
                                    onClick={load}
                                    disabled={loading}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Aktualisieren
                                </Button>

                                <Button
                                    onClick={goMeldungen}
                                    disabled={loading || !id}
                                    className="gap-2"
                                >
                                    Meldungen öffnen
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="text-xs font-semibold text-brand-text2">Status</div>
                                <Badge tone={toneForStatus(data?.status ?? "")}>
                                    {data?.status ?? "—"}
                                </Badge>
                            </div>

                            <div className="text-sm text-brand-text2">
                                Erstellt: {data?.createdAt ?? "—"}
                            </div>

                            <div className="rounded-2xl border border-brand-border bg-white p-4 text-sm text-brand-text2">
                                Nächster Schritt: Meldungen (Versionierung · Draft · Submit)
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <code className="rounded bg-brand-bg px-1">
                                        GET /falloeffnungen/{`{id}`}
                                    </code>
                                    <code className="rounded bg-brand-bg px-1">
                                        POST /falloeffnungen/{`{id}`}/notizen
                                    </code>
                                    <code className="rounded bg-brand-bg px-1">
                                        PATCH /falloeffnungen/{`{id}`}/status
                                    </code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}