"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { MeldungEditor } from "@/components/meldung/MeldungEditor";
import {
    meldungApi,
    type MeldungDraftRequest,
    type MeldungResponse,
} from "@/lib/api/meldung";

type ParamValue = string | string[] | undefined;

function parseId(param: ParamValue): number | null {
    const raw = Array.isArray(param) ? param[0] : param;
    if (typeof raw !== "string") return null;

    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function isLockedStatus(status: string | null | undefined) {
    const s = (status ?? "").toLowerCase();
    return (
        s.includes("abgesch") ||
        s.includes("geschlossen") ||
        s.includes("submitted") ||
        s.includes("freigabe") ||
        s.includes("freigegeben")
    );
}

function asRecord(v: unknown): Record<string, unknown> | null {
    return typeof v === "object" && v !== null ? (v as Record<string, unknown>) : null;
}

function readNumber(v: unknown): number | undefined {
    return typeof v === "number" ? v : undefined;
}

function getStatus(e: unknown): number | undefined {
    const obj = asRecord(e);
    if (!obj) return undefined;

    const direct = readNumber(obj.status);
    if (direct !== undefined) return direct;

    const response = asRecord(obj.response);
    const data = asRecord(obj.data);
    const error = asRecord(obj.error);

    return (
        readNumber(response?.status) ??
        readNumber(data?.status) ??
        readNumber(error?.status)
    );
}

export default function ErstmeldungPage() {
    const params = useParams<{ fallId?: string | string[] }>();
    const router = useRouter();

    const fallId = parseId(params.fallId);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);
    const [meldung, setMeldung] = React.useState<MeldungResponse | null>(null);

    React.useEffect(() => {
        if (fallId == null) return; // ✅ narrow first
        const id = fallId; // ✅ id is now `number`

        let cancelled = false;

        async function load() {
            setErr(null);
            setLoading(true);

            try {
                // 1️⃣ Versuche vorhandenes current zu laden
                const current = await meldungApi.current(id);
                if (!cancelled) setMeldung(current);
            } catch (e: unknown) {
                const status = getStatus(e);

                if (status === 404) {
                    // 2️⃣ Keine Meldung vorhanden → automatisch Draft
                    try {
                        const created = await meldungApi.ensureCurrent(id);
                        if (!cancelled) setMeldung(created);
                    } catch {
                        if (!cancelled) setErr("Erstmeldung konnte nicht gestartet werden.");
                    }
                } else {
                    if (!cancelled) setErr("Konnte Erstmeldung nicht laden.");
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

    const onSaveDraft = React.useCallback(
        async (req: MeldungDraftRequest) => {
            if (fallId == null || !meldung) return;
            const id = fallId;

            const updated = await meldungApi.saveDraft(id, meldung.id, req);
            setMeldung(updated);
            return updated;
        },
        [fallId, meldung]
    );

    const onSubmit = React.useCallback(
        async (mirrorToNotizen: boolean) => {
            if (fallId == null || !meldung) return;
            const id = fallId;

            await meldungApi.submit(id, meldung.id, { mirrorToNotizen });
            router.replace(`/dashboard/falloeffnungen/${id}/meldungen`);
        },
        [fallId, meldung, router]
    );

    const disabled = isLockedStatus(meldung?.status);

    if (fallId == null) {
        return (
            <div className="p-6">
                <Alert>
                    <AlertTitle>Ungültige Fall-ID</AlertTitle>
                    <AlertDescription>Die URL enthält keine gültige fallId.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-background text-foreground">
                <Topbar title="Erstmeldung" />

                <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-10 pt-4 sm:px-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="w-full sm:w-auto"
                        >
                            Zurück
                        </Button>

                        <div className="text-xs text-muted-foreground">
                            Fall #{fallId}
                            {meldung ? ` · Meldung #${meldung.id} · v${meldung.versionNo}` : ""}
                        </div>
                    </div>

                    {err ? (
                        <Alert>
                            <AlertTitle>Hinweis</AlertTitle>
                            <AlertDescription>{err}</AlertDescription>
                        </Alert>
                    ) : null}

                    {loading ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold">Lade…</div>
                                <div className="text-xs text-muted-foreground">
                                    Erstmeldung wird vorbereitet.
                                </div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">
                                Bitte einen Moment…
                            </CardContent>
                        </Card>
                    ) : meldung ? (
                        <MeldungEditor
                            value={meldung}
                            disabled={disabled}
                            onSaveDraft={onSaveDraft}
                            onSubmit={onSubmit}
                        />
                    ) : null}
                </div>
            </div>
        </AuthGate>
    );
}