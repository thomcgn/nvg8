"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { MeldungEditor } from "@/components/meldung/MeldungEditor";
import { meldungApi, type MeldungDraftRequest, type MeldungResponse } from "@/lib/api/meldung";

function parseId(param: unknown): number | null {
    if (typeof param === "string") {
        const n = Number(param);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (Array.isArray(param) && typeof param[0] === "string") {
        const n = Number(param[0]);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

function errorMessage(e: unknown, fallback: string) {
    if (e && typeof e === "object" && "message" in e && typeof (e as any).message === "string") {
        return (e as any).message as string;
    }
    return fallback;
}

export default function ErstmeldungWizardPage() {
    const params = useParams();
    const router = useRouter();
    const fallId = parseId((params as any)?.fallId);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);
    const [meldung, setMeldung] = React.useState<MeldungResponse | null>(null);

    const refresh = React.useCallback(async () => {
        if (!fallId) return;
        setErr(null);
        setLoading(true);
        try {
            // 1) versuche current
            const cur = await meldungApi.current(fallId);
            setMeldung(cur);
        } catch (e: any) {
            // 2) wenn es noch keine Meldung gibt, lege eine neue an
            try {
                const created = await meldungApi.createNew(fallId, null);
                setMeldung(created);
            } catch (e2: any) {
                setErr(errorMessage(e2, "Konnte Erstmeldung nicht laden/erstellen."));
                setMeldung(null);
            }
        } finally {
            setLoading(false);
        }
    }, [fallId]);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const onSaveDraft = React.useCallback(
        async (req: MeldungDraftRequest) => {
            if (!fallId || !meldung) return;
            const updated = await meldungApi.saveDraft(fallId, meldung.id, req);
            setMeldung(updated);
            return updated;
        },
        [fallId, meldung]
    );

    const onSubmit = React.useCallback(
        async (mirrorToNotizen: boolean) => {
            if (!fallId || !meldung) return;
            await meldungApi.submit(fallId, meldung.id, { mirrorToNotizen });
            // nach Submit zurück zur Meldungs-Übersicht (Versionen)
            router.replace(`/dashboard/falloeffnungen/${fallId}/meldungen`);
        },
        [fallId, meldung, router]
    );

    const disabled = (meldung?.status || "").toUpperCase().includes("ABGESCHLOSSEN");

    if (!fallId) {
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
                        <Button variant="secondary" onClick={() => router.back()} className="w-full sm:w-auto">
                            Zurück
                        </Button>
                        <div className="text-xs text-muted-foreground">
                            Fall #{fallId}
                            {meldung ? ` · Meldung #${meldung.id} · v${meldung.versionNo}` : ""}
                        </div>
                    </div>

                    {err ? (
                        <Alert>
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription className="break-words">{err}</AlertDescription>
                        </Alert>
                    ) : null}

                    {loading ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold">Lade…</div>
                                <div className="text-xs text-muted-foreground">Erstmeldung wird geladen.</div>
                            </CardHeader>
                            <CardContent className="text-sm text-muted-foreground">Bitte einen Moment…</CardContent>
                        </Card>
                    ) : !meldung ? (
                        <Card>
                            <CardHeader>
                                <div className="text-sm font-semibold">Keine Meldung</div>
                                <div className="text-xs text-muted-foreground">
                                    Es konnte keine Meldung geladen oder erstellt werden.
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Button onClick={refresh}>Erneut versuchen</Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <MeldungEditor value={meldung} disabled={disabled} onSaveDraft={onSaveDraft} onSubmit={onSubmit} />
                    )}
                </div>
            </div>
        </AuthGate>
    );
}