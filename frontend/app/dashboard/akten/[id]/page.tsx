"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import type { FalleroeffnungResponse } from "@/lib/types";
import { FileText, RefreshCw } from "lucide-react";

function toneForStatus(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
    const s = (status || "").toLowerCase();
    if (s.includes("hoch") || s.includes("krit") || s.includes("risiko")) return "danger";
    if (s.includes("warn") || s.includes("prüf") || s.includes("review")) return "warning";
    if (s.includes("abgesch") || s.includes("done") || s.includes("geschlossen")) return "success";
    if (s.includes("offen") || s.includes("neu")) return "info";
    return "neutral";
}

export default function AkteDetailsPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params?.id);

    const [data, setData] = useState<FalleroeffnungResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function load() {
        if (!id || Number.isNaN(id)) return;
        setErr(null);
        setLoading(true);
        try {
            const res = await apiFetch<FalleroeffnungResponse>(`/falloeffnungen/${id}`, { method: "GET" });
            setData(res);
        } catch (e: any) {
            setErr(e?.message || "Konnte Fall nicht laden.");
            setData(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

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
                                        {data?.aktenzeichen ?? (loading ? "Lade…" : `Fall #${id}`)}
                                    </div>
                                    <div className="mt-1 text-xs text-brand-text2">
                                        {data?.kindName ? `Kind: ${data.kindName}` : " "}
                                    </div>
                                </div>
                            </div>

                            <Button variant="secondary" onClick={load} disabled={loading} className="gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Aktualisieren
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="text-xs font-semibold text-brand-text2">Status</div>
                                <Badge tone={toneForStatus(data?.status ?? "")}>{data?.status ?? "—"}</Badge>
                            </div>

                            <div className="text-sm text-brand-text2">
                                Erstellt: {data?.createdAt ?? "—"}
                            </div>

                            <div className="rounded-2xl border border-brand-border bg-white p-4 text-sm text-brand-text2">
                                Nächster Schritt: Notizen & Statuswechsel (Endpunkte sind vorhanden):
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <code className="rounded bg-brand-bg px-1">POST /falloeffnungen/{`{id}`}/notizen</code>
                                    <code className="rounded bg-brand-bg px-1">PATCH /falloeffnungen/{`{id}`}/status</code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}