"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { CaseOverview } from "@/components/fall/CaseOverview";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { apiFetch } from "@/lib/api";
import type { FalleroeffnungResponse } from "@/lib/types";
import {
    meldungApi,
    type MeldungListItemResponse,
} from "@/lib/meldungApi";

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

                <div className="mx-auto w-full max-w-screen-2xl 2xl:max-w-[1800px] space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-8">
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

                            
                        </>
                    )}
                </div>
            </div>
        </AuthGate>
    );
}