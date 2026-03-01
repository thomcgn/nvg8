"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { akteApi, type AkteResponse } from "@/lib/api/akte";
import { Plus, ArrowRight, RefreshCw } from "lucide-react";

function parseId(param: unknown): number | null {
    if (typeof param === "string") {
        const n = Number(param);
        return Number.isFinite(n) ? n : null;
    }
    if (Array.isArray(param) && typeof param[0] === "string") {
        const n = Number(param[0]);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function badgeTone(status: string): "success" | "warning" | "danger" | "info" | "neutral" {
    const s = (status || "").toLowerCase();
    if (s.includes("abgeschlossen") || s.includes("geschlossen")) return "success";
    if (s.includes("offen") || s.includes("neu")) return "info";
    return "neutral";
}

export default function AktePage() {
    const params = useParams();
    const router = useRouter();
    const akteId = parseId((params as any)?.akteId);

    const [data, setData] = React.useState<AkteResponse | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const load = React.useCallback(async () => {
        if (!akteId) return;
        setErr(null);
        setLoading(true);
        try {
            const res = await akteApi.get(akteId);
            setData(res);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Laden der Akte");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [akteId]);

    React.useEffect(() => {
        load();
    }, [load]);

    const createFall = async () => {
        if (!akteId) return;
        setErr(null);
        setLoading(true);
        try {
            const created = await akteApi.createFall(akteId, null);
            // direkt in Wizard
            router.push(`/dashboard/faelle/${created.id}/meldungen?open=erstmeldung`);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Erstellen des Falls");
        } finally {
            setLoading(false);
        }
    };

    const openWizard = (fallId: number) => {
        router.push(`/dashboard/faelle/${fallId}/meldungen?open=erstmeldung`);
    };

    if (!akteId) {
        return (
            <div className="p-6">
                <Alert>
                    <AlertTitle>Ungültige Akten-ID</AlertTitle>
                    <AlertDescription>Route muss /dashboard/akten/&lt;akteId&gt; sein.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Akte" />

                <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-10 pt-4 sm:px-6">
                    {err ? (
                        <Alert>
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription className="break-words">{err}</AlertDescription>
                        </Alert>
                    ) : null}

                    <Card>
                        <CardHeader className="flex-row items-center justify-between">
                            <div>
                                <div className="text-sm text-brand-text2">Akte</div>
                                <div className="text-xl font-semibold text-brand-navy">
                                    {loading ? "Lade…" : data?.kindName ?? `#${akteId}`}
                                </div>
                                <div className="mt-1 text-xs text-brand-text2">Akte-ID: {akteId}</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="secondary" onClick={load} disabled={loading} className="gap-2">
                                    <RefreshCw className="h-4 w-4" /> Aktualisieren
                                </Button>
                                <Button onClick={createFall} disabled={loading} className="gap-2">
                                    <Plus className="h-4 w-4" /> Neuer Fall
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            <Separator />
                            {!data?.faelle?.length ? (
                                <div className="text-sm text-brand-text2">Noch keine Fälle in dieser Akte.</div>
                            ) : (
                                <div className="space-y-2">
                                    {data.faelle.map((f) => (
                                        <div
                                            key={f.id}
                                            className="rounded-xl border border-brand-border bg-white p-3 flex items-center justify-between gap-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-semibold text-brand-navy truncate">
                                                        {f.titel || `Fall #${f.id}`}
                                                    </div>
                                                    <Badge tone={badgeTone(f.status)}>{f.status}</Badge>
                                                </div>
                                                <div className="mt-1 text-xs text-brand-text2">
                                                    Aktenzeichen: <span className="font-mono">{f.aktenzeichen}</span>
                                                </div>
                                            </div>

                                            <Button onClick={() => openWizard(f.id)} className="gap-2">
                                                Erstmeldung öffnen <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}