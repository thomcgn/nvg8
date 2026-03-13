"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { CaseOverview } from "@/components/fall/CaseOverview";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { apiFetch } from "@/lib/api";
import type { FalleroeffnungResponse } from "@/lib/types";
import {
    meldungApi,
    type MeldungListItemResponse,
} from "@/lib/meldungApi";

import { FileText, FileOutput } from "lucide-react";

function safeNumber(v: unknown): number | null {
    if (typeof v === "number") return Number.isFinite(v) ? v : null;
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

export default function FallPage() {
    const params = useParams<{ fallId?: string | string[] }>();
    const fallId = safeNumber(params.fallId);

    const [fall, setFall] = useState<FalleroeffnungResponse | null>(null);
    const [meldungen, setMeldungen] = useState<MeldungListItemResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!fallId) return;
        const fid: number = fallId;

        let cancelled = false;

        async function load() {
            setLoading(true);
            setErr(null);

            try {
                const [fallRes, meldungenRes] = await Promise.all([
                    apiFetch<FalleroeffnungResponse>(`/falloeffnungen/${fid}`),
                    meldungApi.list(fid),
                ]);

                if (cancelled) return;

                setFall(fallRes);
                setMeldungen(meldungenRes);
            } catch (e: unknown) {
                if (!cancelled) {
                    setErr(errorMessage(e, "Der Fall konnte nicht geladen werden."));
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, [fallId]);

    return (
        <AuthGate>
            <div className="min-h-screen bg-background text-foreground">
                <Topbar title="Fallübersicht" />

                <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-10 pt-4 sm:px-6">
                    {fallId == null ? (
                        <Alert>
                            <AlertTitle>Ungültige Fall-ID</AlertTitle>
                            <AlertDescription>
                                Die URL enthält keine gültige Fall-ID.
                            </AlertDescription>
                        </Alert>
                    ) : err ? (
                        <Alert>
                            <AlertTitle>Fall nicht verfügbar</AlertTitle>
                            <AlertDescription>{err}</AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <CaseOverview
                                fallId={fallId}
                                fall={fall}
                                meldungen={meldungen}
                                loading={loading}
                            />

                            <Card>
                                <CardHeader>
                                    <div className="text-lg font-semibold">Fall bearbeiten</div>
                                </CardHeader>

                                <CardContent className="flex flex-col gap-3 sm:flex-row">
                                    <Button asChild className="gap-2">
                                        <Link href={`/dashboard/falloeffnungen/${fallId}/meldung`}>
                                            <FileText className="h-4 w-4" />
                                            MeldungsWizard öffnen
                                        </Link>
                                    </Button>

                                    <Button asChild variant="outline" className="gap-2">
                                        <Link href={`/dashboard/falloeffnungen/${fallId}/export`}>
                                            <FileOutput className="h-4 w-4" />
                                            Fallakte als PDF
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </AuthGate>
    );
}