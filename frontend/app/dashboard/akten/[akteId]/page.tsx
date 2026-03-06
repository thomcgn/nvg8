"use client";

import * as React from "react";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { apiFetch, ApiError } from "@/lib/api";
import { ArrowLeft, Plus, ArrowRight, RefreshCw, FolderOpen, AlertTriangle, FileText } from "lucide-react";

import { findFallWithDraftMeldung, loadMeldungStatusByFallIds, type FallListItem } from "@/lib/fall";

/* ---------------- Helpers ---------------- */

function safeNumber(v: unknown): number | null {
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (Array.isArray(v) && typeof v[0] === "string") {
        const n = Number(v[0]);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
    return null;
}

function formatDateTimeDE(v?: string | null) {
    if (!v) return "—";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function toneForStatus(status: string | null | undefined): "success" | "warning" | "danger" | "info" | "neutral" {
    const s = (status || "").toLowerCase();
    if (s.includes("hoch") || s.includes("krit") || s.includes("risiko")) return "danger";
    if (s.includes("warn") || s.includes("prüf") || s.includes("review") || s.includes("in_pruef")) return "warning";
    if (s.includes("abgesch") || s.includes("done") || s.includes("geschlossen") || s.includes("abgeschlossen"))
        return "success";
    if (s.includes("offen") || s.includes("neu")) return "info";
    return "neutral";
}

function isMeldungLocked(status: string | null | undefined) {
    const s = String(status ?? "").toLowerCase();
    return (
        s.includes("abgesch") ||
        s.includes("abgeschlossen") ||
        s.includes("geschlossen") ||
        s.includes("submitted") ||
        s.includes("submit") ||
        s.includes("freigabe") ||
        s.includes("freigegeben")
    );
}

function extractRequestedEinrichtungId(err: unknown): number | null {
    if (!(err instanceof ApiError)) return null;
    const meta = err.problem?.meta as any;

    const candidates = [
        meta?.requestedEinrichtungOrgUnitId,
        meta?.einrichtungOrgUnitId,
        meta?.requestedEinrichtungId,
        meta?.einrichtungId,
    ];

    for (const c of candidates) {
        const n = typeof c === "number" ? c : typeof c === "string" ? Number(c) : null;
        if (n && Number.isFinite(n) && n > 0) return n;
    }
    return null;
}

/* ---------------- Types ---------------- */

type AkteResponse = {
    akteId: number;
    kindId: number;
    kindName: string | null;
    enabled: boolean;
    createdAt?: string | null;
    einrichtungOrgUnitId?: number | null;
};

type FallListResponse = {
    items: FallListItem[];
    total: number;
};

type CreateFallRequest = {
    titel?: string | null;
    kurzbeschreibung?: string | null;
    einrichtungOrgUnitId?: number | null;
    teamOrgUnitId?: number | null;
};

type CreateFallResponse = {
    id: number;
};

type ContextResponse = {
    active?: {
        traegerId?: number | null;
        einrichtungOrgUnitId?: number | null;
        roles?: string[];
    };
};

type ContextActive = {
    traegerId?: number | null;
    einrichtungOrgUnitId?: number | null;
    roles?: string[];
};

/* ---------------- Page ---------------- */

export default function AkteDetailPage() {
    const router = useRouter();
    const params = useParams();

    // ✅ Route ist /dashboard/akten/[id]
    const akteId = useMemo(() => {
        const p: any = params as any;
        return safeNumber(p?.akteId) ?? safeNumber(p?.id) ?? null;
    }, [params]);
    const [akte, setAkte] = React.useState<AkteResponse | null>(null);
    const [faelle, setFaelle] = React.useState<FallListResponse | null>(null);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const [meldungStatusByFallId, setMeldungStatusByFallId] = React.useState<Record<number, string>>({});
    const [loadingMeldungStates, setLoadingMeldungStates] = React.useState(false);

    const [context, setContext] = React.useState<ContextActive | null>(null);
    const [contextRequired, setContextRequired] = React.useState(false);
    const [contextHint, setContextHint] = React.useState<string | null>(null);
    const [switchingContext, setSwitchingContext] = React.useState(false);

    const loadContext = React.useCallback(async () => {
        try {
            const ctx = await apiFetch<ContextResponse>(`/auth/contexts`, { method: "GET" });
            setContext(ctx?.active ?? null);
        } catch {
            setContext(null);
        }
    }, []);

    const trySwitchContextAndRetry = React.useCallback(
        async (requestedEinrichtungOrgUnitId: number, retryFn: () => Promise<void>) => {
            setSwitchingContext(true);
            setContextHint(null);

            try {
                await apiFetch(`/auth/context/switch`, {
                    method: "POST",
                    body: { orgUnitId: requestedEinrichtungOrgUnitId },
                });

                await loadContext();
                setContextRequired(false);
                await retryFn();
            } catch (e: any) {
                setContextHint(e?.message || "Kontext konnte nicht gewechselt werden.");
            } finally {
                setSwitchingContext(false);
            }
        },
        [loadContext]
    );

    const load = React.useCallback(async () => {
        if (!akteId) return;

        setLoading(true);
        setErr(null);
        setContextRequired(false);
        setContextHint(null);

        try {
            await loadContext();

            // ✅ Akte Detail
            const a = await apiFetch<AkteResponse>(`/api/akten/${akteId}`, { method: "GET" });
            setAkte(a);

            // ✅ Fälle
            const f = await apiFetch<FallListResponse>(`/api/akten/${akteId}/faelle`, { method: "GET" });
            setFaelle(f);

            // ✅ Meldung-Status pro Fall laden
            const ids = (f?.items || []).map((x) => x.id);
            setLoadingMeldungStates(true);
            const map = await loadMeldungStatusByFallIds(ids);
            setMeldungStatusByFallId(map);
        } catch (e: any) {
            if (e instanceof ApiError && e.code === "CONTEXT_REQUIRED") {
                setContextRequired(true);
                setErr(null);

                const requested = extractRequestedEinrichtungId(e);
                setContextHint(
                    requested
                        ? `Kontext erforderlich (Ziel-Einrichtung #${requested}).`
                        : "Kontext erforderlich. Bitte zur passenden Einrichtung wechseln."
                );

                setFaelle(null);
                setMeldungStatusByFallId({});
            } else {
                setErr(e?.message || "Konnte Akte nicht laden.");
                setAkte(null);
                setFaelle(null);
                setMeldungStatusByFallId({});
            }
        } finally {
            setLoading(false);
            setLoadingMeldungStates(false);
        }
    }, [akteId, loadContext]);

    React.useEffect(() => {
        load();
    }, [load]);

    const fallItems = faelle?.items || [];
    const total = faelle?.total ?? fallItems.length ?? 0;

    const fallWithDraftMeldung = useMemo(
        () => findFallWithDraftMeldung(fallItems, meldungStatusByFallId),
        [fallItems, meldungStatusByFallId]
    );
    const hasDraftMeldungBlocking = !!fallWithDraftMeldung;

    const createFall = React.useCallback(async () => {
        if (!akteId) return;

        setErr(null);
        setContextRequired(false);
        setContextHint(null);

        if (hasDraftMeldungBlocking && fallWithDraftMeldung) {
            setErr(
                `Es gibt bereits eine Erstmeldung im Entwurf (${fallWithDraftMeldung.aktenzeichen || `Fall #${fallWithDraftMeldung.id}`}). ` +
                `Bitte diesen Entwurf zuerst fertigstellen oder löschen/abschließen.`
            );
            return;
        }

        const doCreate = async () => {
            const created = await apiFetch<CreateFallResponse>(`/api/akten/${akteId}/faelle`, {
                method: "POST",
                body: {
                    titel: null,
                    kurzbeschreibung: "Fall gestartet aus Akte.",
                    einrichtungOrgUnitId: akte?.einrichtungOrgUnitId ?? null,
                    teamOrgUnitId: null,
                } satisfies CreateFallRequest,
            });

            if (!created?.id) throw new Error("Fall konnte nicht erstellt werden (keine id).");
            router.push(`/dashboard/falloeffnungen/${created.id}/meldung`);
        };

        try {
            await doCreate();
        } catch (e: any) {
            if (e instanceof ApiError && e.code === "CONTEXT_REQUIRED") {
                setContextRequired(true);

                const requested = extractRequestedEinrichtungId(e);
                if (requested) {
                    await trySwitchContextAndRetry(requested, async () => {
                        await doCreate();
                    });
                } else {
                    setContextHint("Aktiver Kontext passt nicht zur Einrichtung dieser Akte. Bitte Kontext wechseln und erneut versuchen.");
                }
                return;
            }

            setErr(e?.message || "Fall konnte nicht erstellt werden.");
        }
    }, [
        akteId,
        router,
        akte?.einrichtungOrgUnitId,
        trySwitchContextAndRetry,
        hasDraftMeldungBlocking,
        fallWithDraftMeldung,
    ]);

    const createFallDisabled =
        loading || !akteId || switchingContext || contextRequired || loadingMeldungStates || hasDraftMeldungBlocking;

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title="Akte" />

                <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 pb-12 pt-4 space-y-4">
                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="secondary" onClick={() => router.back()} className="w-full sm:w-auto gap-2 h-11">
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button variant="secondary" onClick={load} disabled={loading} className="w-full sm:w-auto gap-2 h-11">
                                <RefreshCw className="h-4 w-4" />
                                Aktualisieren
                            </Button>

                            <Button
                                onClick={createFall}
                                disabled={createFallDisabled}
                                className="w-full sm:w-auto gap-2 h-11"
                                title={
                                    hasDraftMeldungBlocking && fallWithDraftMeldung
                                        ? `Deaktiviert: Entwurf existiert (${fallWithDraftMeldung.aktenzeichen || `Fall #${fallWithDraftMeldung.id}`})`
                                        : loadingMeldungStates
                                            ? "Prüfe Meldungsstatus…"
                                            : undefined
                                }
                            >
                                <Plus className="h-4 w-4" />
                                Neuer Fall
                            </Button>
                        </div>
                    </div>

                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    {hasDraftMeldungBlocking && fallWithDraftMeldung ? (
                        <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text space-y-1">
                            <div className="flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 text-brand-text2" />
                                <div className="min-w-0">
                                    <div className="font-semibold">Neuer Fall gesperrt</div>
                                    <div className="text-brand-text2">
                                        Es existiert bereits eine Meldung im <span className="font-semibold">Entwurf</span> für{" "}
                                        <span className="font-semibold">{fallWithDraftMeldung.aktenzeichen || `Fall #${fallWithDraftMeldung.id}`}</span>.
                                        Solange dieser Entwurf existiert, kann kein neuer Fall angelegt werden.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {contextRequired ? (
                        <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text space-y-2">
                            <div className="font-semibold">Kontext erforderlich</div>
                            <div className="text-brand-text2">
                                {contextHint || "Aktiver Kontext passt nicht zur Einrichtung dieser Akte. Bitte Kontext wechseln und erneut versuchen."}
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <Button
                                    variant="secondary"
                                    onClick={() => router.push("/dashboard/context")}
                                    className="w-full sm:w-auto"
                                    disabled={switchingContext}
                                >
                                    Kontext wechseln
                                </Button>

                                <div className="text-xs text-brand-text2">Aktuell: Einrichtung #{context?.einrichtungOrgUnitId ?? "—"}</div>
                            </div>
                        </div>
                    ) : null}

                    {/* Summary */}
                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 sm:p-5">
                        <div className="flex items-start gap-3 min-w-0">
                            <FolderOpen className="h-5 w-5 text-brand-text2 mt-0.5" />
                            <div className="min-w-0">
                                <div className="text-base font-semibold text-brand-text truncate">
                                    {akte?.kindName ? `Akte: ${akte.kindName}` : loading ? "Lade…" : akteId ? `Akte #${akteId}` : "Akte"}
                                </div>
                                <div className="mt-1 text-sm text-brand-text2 truncate">
                                    {akte ? `Kind-ID: ${akte.kindId}` : "—"}
                                    {akte?.einrichtungOrgUnitId ? ` · Einrichtung #${akte.einrichtungOrgUnitId}` : ""}
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                <div className="text-xs font-semibold text-brand-text2">Akte-ID</div>
                                <div className="mt-1 text-sm font-semibold text-brand-text">{akteId ?? "—"}</div>
                            </div>

                            <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                <div className="text-xs font-semibold text-brand-text2">Erstellt</div>
                                <div className="mt-1 text-sm font-semibold text-brand-text">{formatDateTimeDE(akte?.createdAt ?? null)}</div>
                            </div>

                            <div className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                <div className="text-xs font-semibold text-brand-text2">Fälle</div>
                                <div className="mt-1 text-sm font-semibold text-brand-text">{loading ? "…" : total}</div>
                            </div>
                        </div>
                    </div>

                    {/* Fälle */}
                    <Card className="border border-brand-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold text-brand-text">Fälle</div>
                                <div className="mt-1 text-xs text-brand-text2">Alle Fälle dieser Akte</div>
                            </div>
                            <div className="text-xs text-brand-text2">{loading ? "…" : `${total} Einträge`}</div>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            {!fallItems.length ? (
                                <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                    {contextRequired
                                        ? "Fälle können erst geladen werden, nachdem der Kontext zur passenden Einrichtung gewechselt wurde."
                                        : "Noch keine Fälle in dieser Akte. Erstelle den ersten Fall über „Neuer Fall“."}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {fallItems.map((f) => {
                                        const msRaw = meldungStatusByFallId[f.id] || "";
                                        const ms = msRaw.toUpperCase();
                                        const msIsDraft = ms === "ENTWURF" || ms === "DRAFT";
                                        const msLocked = isMeldungLocked(msRaw);

                                        const opened = (f as any)?.openedAt ?? (f as any)?.createdAt ?? null;

                                        return (
                                            <div key={f.id} className="rounded-2xl border border-brand-border/25 bg-white p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <FileText className="h-4 w-4 text-brand-text2 shrink-0" />
                                                            <div className="text-sm font-semibold text-brand-text break-words">
                                                                {f.fallNo ? `Fall ${f.fallNo}` : "Fall"} · {f.aktenzeichen || `#${f.id}`}
                                                            </div>
                                                        </div>
                                                        <div className="mt-1 text-xs text-brand-text2">Eröffnet: {formatDateTimeDE(opened)}</div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge tone={toneForStatus((f as any)?.status)}>{(f as any)?.status || "—"}</Badge>

                                                        {loadingMeldungStates ? (
                                                            <Badge tone="neutral">Meldung…</Badge>
                                                        ) : msIsDraft ? (
                                                            <Badge tone="warning">Meldung: Entwurf</Badge>
                                                        ) : ms ? (
                                                            <Badge tone="neutral">Meldung: {ms}</Badge>
                                                        ) : (
                                                            <Badge tone="neutral">Keine Meldung</Badge>
                                                        )}

                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            className="gap-2"
                                                            onClick={() => router.push(`/dashboard/falloeffnungen/${f.id}?autostart=meldungen`)}
                                                        >
                                                            Meldungen
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Button>

                                                        {!msLocked ? (
                                                            <Button size="sm" className="gap-2" onClick={() => router.push(`/dashboard/falloeffnungen/${f.id}/meldung`)}>
                                                                Entwurf öffnen
                                                                <ArrowRight className="h-4 w-4" />
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthGate>
    );
}