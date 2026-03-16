    "use client";

    import * as React from "react";
    import { useParams, useRouter } from "next/navigation";

    import { AuthGate } from "@/components/AuthGate";
    import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
    import { Card, CardContent, CardHeader } from "@/components/ui/card";
    import { Button } from "@/components/ui/button";
    import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

    import { MeldungEditor } from "@/components/meldung/MeldungEditor";
    import { meldungApi, type MeldungDraftRequest, type MeldungResponse } from "@/lib/api/meldung";

    type UnknownRecord = Record<string, unknown>;

    function asRecord(value: unknown): UnknownRecord | null {
        return typeof value === "object" && value !== null ? (value as UnknownRecord) : null;
    }

    function getProp(value: unknown, key: string): unknown {
        const rec = asRecord(value);
        return rec ? rec[key] : undefined;
    }

    function parseId(param: unknown): number | null {
        if (typeof param === "number") return Number.isFinite(param) && param > 0 ? param : null;
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

    function getStatus(error: unknown): number | undefined {
        const candidates = [
            getProp(error, "status"),
            getProp(getProp(error, "response"), "status"),
            getProp(getProp(error, "data"), "status"),
            getProp(getProp(error, "error"), "status"),
        ];

        for (const candidate of candidates) {
            const parsed = parseId(candidate);
            if (parsed !== null) return parsed;
        }

        return undefined;
    }

    // 👇 versucht aktenId aus params oder meldung zu ziehen
    function getAktenId(params: unknown, meldung: unknown, fallId: number | null) {
        return (
            parseId(getProp(params, "aktenId")) ||
            parseId(getProp(meldung, "aktenId")) ||
            parseId(getProp(meldung, "akteId")) ||
            parseId(getProp(getProp(meldung, "akte"), "id")) ||
            // Fallback, falls bei euch Akte == Fall (wenn nicht, nimm diese Zeile raus)
            fallId
        );
    }

    export default function MeldungCurrentPage() {
        const params = useParams();
        const router = useRouter();
        const fallId = parseId(getProp(params, "fallId"));

        const [loading, setLoading] = React.useState(true);
        const [err, setErr] = React.useState<string | null>(null);
        const [meldung, setMeldung] = React.useState<MeldungResponse | null>(null);

        const refresh = React.useCallback(async () => {
            if (!fallId) return;

            let redirected = false;

            setErr(null);
            setLoading(true);

            try {
                const m = await meldungApi.current(fallId);
                setMeldung(m);
            } catch (e: unknown) {
                const status = getStatus(e);

                if (status === 404) {
                    redirected = true;
                    router.replace(`/dashboard/falloeffnungen/${fallId}/erstmeldung`);
                    return;
                }

                setErr("Konnte Erstmeldung nicht laden.");
                setMeldung(null);
            } finally {
                if (!redirected) setLoading(false);
            }
        }, [fallId, router]);

        React.useEffect(() => {
            refresh();
        }, [refresh]);

        const goToAkte = React.useCallback(
            (m?: MeldungResponse | null) => {
                const aktenId = getAktenId(params, m ?? meldung, fallId);
                if (!aktenId) return;
                router.replace(`/dashboard/akten/${aktenId}`);
            },
            [params, meldung, fallId, router]
        );

        const onSaveDraft = React.useCallback(
            async (req: MeldungDraftRequest) => {
                if (!fallId || !meldung) return;
                const updated = await meldungApi.saveDraft(fallId, meldung.id, req);
                setMeldung(updated);

                // ✅ nach erfolgreichem Draft speichern zurück zur Akte
                goToAkte(updated);

                return updated;
            },
            [fallId, meldung, goToAkte]
        );

        const onSubmit = React.useCallback(
            async (mirrorToNotizen: boolean, changeReason?: string) => {
                if (!fallId || !meldung) return;
                await meldungApi.submit(fallId, meldung.id, {
                    mirrorToNotizen,
                    changeReason: changeReason?.trim() || null});

                // ✅ nach erfolgreichem Submit zurück zur Akte
                goToAkte(meldung);
            },
            [fallId, meldung, goToAkte]
        );

        const disabled = isLockedStatus(meldung?.status);

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
                                <AlertTitle>Hinweis</AlertTitle>
                                <AlertDescription>{err}</AlertDescription>
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
                        ) : meldung ? (
                            <MeldungEditor fallId={fallId ?? 0} value={meldung} disabled={disabled} onSaveDraftAction={onSaveDraft} onSubmitAction={onSubmit} />
                        ) : null}
                    </div>
                </div>
            </AuthGate>
        );
    }