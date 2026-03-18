"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { MeldungEditor } from "@/components/meldung/MeldungEditor";
import {
    meldungApi,
    type MeldungDraftRequest,
    type MeldungResponse,
} from "@/lib/api/meldung";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FilePen } from "lucide-react";

type ParamValue = string | string[] | undefined;

function parseId(param: ParamValue): number | null {
    const raw = Array.isArray(param) ? param[0] : param;
    if (typeof raw !== "string") return null;

    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
}

function parseQueryId(raw: string | null): number | null {
    if (!raw) return null;
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

function isDraftStatus(status: string | null | undefined) {
    const s = (status ?? "").toLowerCase();
    return s.includes("entwurf") || s.includes("draft");
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
    const searchParams = useSearchParams();

    const fallId = parseId(params.fallId);

    // ✅ optional: gezielt Meldung öffnen (z.B. aus Liste/Audit)
    const meldungIdFromQuery = React.useMemo(() => {
        return parseQueryId(searchParams?.get("meldungId") ?? null);
    }, [searchParams]);

    const modeFromQuery = React.useMemo(() => (searchParams?.get("mode") ?? "").toLowerCase(), [searchParams]);

    // ✅ optional: readonly mode erzwingen (auch wenn Draft)
    const readonlyFromQuery = React.useMemo(() => {
        return modeFromQuery === "readonly" || modeFromQuery === "view";
    }, [modeFromQuery]);

    const isCreateMode = React.useMemo(() => modeFromQuery === "create", [modeFromQuery]);

    // ✅ optional: Korrektur direkt starten nach dem Laden
    const autoStartCorrection = React.useMemo(() => {
        return searchParams?.get("startCorrection") === "1";
    }, [searchParams]);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);
    const [meldung, setMeldung] = React.useState<MeldungResponse | null>(null);
    const [confirmOpen, setConfirmOpen] = React.useState(false);
    const [creating, setCreating] = React.useState(false);
    const [startingCorrection, setStartingCorrection] = React.useState(false);
    const [correctionErr, setCorrectionErr] = React.useState<string | null>(null);
    const [createHint, setCreateHint] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (fallId == null) return;
        const id = fallId;

        let cancelled = false;

        async function load() {
            setErr(null);
            setCorrectionErr(null);
            setCreateHint(null);
            setLoading(true);

            try {
                if (isCreateMode) {
                    let existingCurrent: MeldungResponse | null = null;
                    try {
                        existingCurrent = await meldungApi.current(id);
                    } catch (inner) {
                        if (getStatus(inner) !== 404) throw inner;
                    }

                    if (existingCurrent && isDraftStatus(existingCurrent.status)) {
                        if (!cancelled) {
                            setMeldung(existingCurrent);
                            setCreateHint("Es existiert bereits eine Meldung im Entwurf. Bitte führen Sie diesen Entwurf fort, bevor Sie eine neue Meldung starten.");
                            router.replace(`/dashboard/falloeffnungen/${id}/meldung?meldungId=${existingCurrent.id}`);
                        }
                        return;
                    }

                    const created = await meldungApi.createNew(id);
                    if (cancelled) return;
                    setMeldung(created);
                    setConfirmOpen(false);
                    router.replace(`/dashboard/falloeffnungen/${id}/meldung?meldungId=${created.id}`);
                    return;
                }

                // ✅ 0) Wenn meldungId explizit mitgegeben → genau diese laden (z.B. aus Liste/Audit)
                if (meldungIdFromQuery != null) {
                    try {
                        const m = await meldungApi.get(id, meldungIdFromQuery);
                        if (cancelled) return;

                        // autoStartCorrection: wenn Meldung gesperrt ist, direkt Korrektur starten
                        if (autoStartCorrection && isLockedStatus(m.status) && m.current) {
                            try {
                                const correction = await meldungApi.startCorrection(id, {
                                    targetMeldungId: m.id,
                                });
                                if (!cancelled) setMeldung(correction);
                            } catch {
                                // Korrektur fehlgeschlagen → Meldung im read-only Modus zeigen
                                if (!cancelled) {
                                    setCorrectionErr("Korrektur konnte nicht gestartet werden.");
                                    setMeldung(m);
                                }
                            }
                        } else {
                            if (!cancelled) setMeldung(m);
                        }
                        return;
                    } catch {
                        // wenn die gezielte Meldung nicht geht: klare Meldung + fallback auf current
                        if (!cancelled) {
                            setErr("Die angeforderte Meldung konnte nicht geladen werden (Fallback auf aktuelle Meldung).");
                        }
                    }
                }

                // 1️⃣ Versuche vorhandenes current zu laden
                const current = await meldungApi.current(id);
                if (!cancelled) setMeldung(current);
            } catch (e: unknown) {
                const status = getStatus(e);

                if (isCreateMode) {
                    if (!cancelled) {
                        setErr(
                            status === 409
                                ? "Es existiert bereits eine aktive Meldung. Bitte schließen oder korrigieren Sie sie zuerst."
                                : "Neue Meldung konnte nicht erstellt werden."
                        );
                    }
                    return;
                }

                if (status === 404) {
                    // 2️⃣ Keine Meldung vorhanden → Bestätigung einholen
                    if (!cancelled) setConfirmOpen(true);
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
    }, [fallId, meldungIdFromQuery, autoStartCorrection, isCreateMode, router]);

    const onConfirmCreate = React.useCallback(async () => {
        if (fallId == null) return;
        setCreating(true);
        try {
            const created = await meldungApi.ensureCurrent(fallId);
            setMeldung(created);
            setConfirmOpen(false);
        } catch {
            setErr("Erstmeldung konnte nicht gestartet werden.");
            setConfirmOpen(false);
        } finally {
            setCreating(false);
        }
    }, [fallId]);

    const onCancelCreate = React.useCallback(() => {
        setConfirmOpen(false);
        router.back();
    }, [router]);

    const onSaveDraft = React.useCallback(
        async (req: MeldungDraftRequest) => {
            if (fallId == null || !meldung) return;
            const id = fallId;

            // ✅ Schutz: wenn readonly erzwungen, nicht speichern
            if (readonlyFromQuery) return;

            const updated = await meldungApi.saveDraft(id, meldung.id, req);
            setMeldung(updated);
            return updated;
        },
        [fallId, meldung, readonlyFromQuery]
    );

    const onSubmit = React.useCallback(
        async (mirrorToNotizen: boolean, changeReason?: string) => {
            if (fallId == null || !meldung) return;
            const id = fallId;

            // ✅ Schutz: wenn readonly erzwungen, nicht submitten
            if (readonlyFromQuery) return;

            await meldungApi.submit(id, meldung.id, {
                mirrorToNotizen,
            changeReason: changeReason?.trim() || null});
            router.replace(`/dashboard/falloeffnungen/${id}`);
        },
        [fallId, meldung, router, readonlyFromQuery]
    );

    const onStartCorrection = React.useCallback(async () => {
        if (fallId == null || !meldung) return;
        setCorrectionErr(null);
        setStartingCorrection(true);
        try {
            const correction = await meldungApi.startCorrection(fallId, {
                targetMeldungId: meldung.id,
            });
            setMeldung(correction);
        } catch {
            setCorrectionErr("Korrektur konnte nicht gestartet werden. Bitte erneut versuchen.");
        } finally {
            setStartingCorrection(false);
        }
    }, [fallId, meldung]);

    // ✅ disabled wenn Status locked ODER mode=readonly
    const disabled = readonlyFromQuery || isLockedStatus(meldung?.status);

    // Korrektur-Button zeigen wenn Meldung gesperrt ist (nicht wegen readonly-Query)
    // und die Meldung die aktuelle Version ist (current=true)
    const showCorrectionButton =
        !readonlyFromQuery &&
        isLockedStatus(meldung?.status) &&
        meldung?.current === true;

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

                        <div className="flex items-center gap-3">
                            {showCorrectionButton ? (
                                <Button
                                    variant="outline"
                                    className="gap-2 border-amber-400 text-amber-700 hover:bg-amber-50"
                                    onClick={onStartCorrection}
                                    disabled={startingCorrection}
                                >
                                    <FilePen className="h-4 w-4" />
                                    {startingCorrection ? "Wird vorbereitet…" : "Korrektur starten"}
                                </Button>
                            ) : null}

                            <div className="text-xs text-muted-foreground">
                                Fall #{fallId}
                                {meldung ? ` · Meldung #${meldung.id} · v${meldung.versionNo}` : ""}
                                {readonlyFromQuery ? " · read-only" : ""}
                                {meldungIdFromQuery ? ` · requested=${meldungIdFromQuery}` : ""}
                            </div>
                        </div>
                    </div>

                    {correctionErr ? (
                        <Alert>
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription>{correctionErr}</AlertDescription>
                        </Alert>
                    ) : null}

                    {createHint ? (
                        <Alert>
                            <AlertTitle>Hinweis</AlertTitle>
                            <AlertDescription>{createHint}</AlertDescription>
                        </Alert>
                    ) : null}

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
                            key={meldung.id}
                            fallId={fallId}
                            value={meldung}
                            disabled={disabled}
                            onSaveDraftAction={onSaveDraft}
                            onSubmitAction={onSubmit}
                        />
                    ) : null}
                </div>

                <Dialog open={confirmOpen} onOpenChange={(v) => { if (!v) onCancelCreate(); }}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Erstmeldung eröffnen?</DialogTitle>
                            <DialogDescription className="pt-2 text-sm">
                                Hiermit wird eine Erstmeldung für Fall #{fallId} eröffnet.
                                Eine einmal erstellte Meldung kann <strong>nicht gelöscht</strong> werden.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4 flex gap-2">
                            <Button variant="secondary" onClick={onCancelCreate} disabled={creating}>
                                Abbrechen
                            </Button>
                            <Button onClick={onConfirmCreate} disabled={creating}>
                                {creating ? "Wird erstellt…" : "Meldung eröffnen"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthGate>
    );
}