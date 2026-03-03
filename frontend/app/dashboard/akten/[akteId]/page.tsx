"use client";

import * as React from "react";
import { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";
import { ArrowLeft, Plus, ArrowRight, RefreshCw } from "lucide-react";
import {
    findFallWithDraftMeldung,
    loadMeldungStatusByFallIds,
    type FallListItem,
} from "@/lib/fall";

function safeNumber(v: unknown): number | null {
    if (typeof v === "string") {
        const n = Number(v);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (Array.isArray(v) && typeof v[0] === "string") {
        const n = Number(v[0]);
        return Number.isFinite(n) && n > 0 ? n : null;
    }
    return null;
}

type AkteResponse = {
    id: number;
    kindId: number;
    kindName: string | null;
    createdAt: string | null;

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
    available?: Array<{
        traegerId: number;
        traegerName?: string;
        einrichtungOrgUnitId: number;
        einrichtungName?: string;
        roles?: string[];
    }>;
};

type ContextActive = {
    traegerId?: number | null;
    einrichtungOrgUnitId?: number | null;
    roles?: string[];
};

function toneForStatus(status: string | null | undefined): "success" | "warning" | "danger" | "info" | "neutral" {
    const s = (status || "").toLowerCase();
    if (s.includes("hoch") || s.includes("krit") || s.includes("risiko")) return "danger";
    if (s.includes("warn") || s.includes("prüf") || s.includes("review") || s.includes("in_pruef")) return "warning";
    if (s.includes("abgesch") || s.includes("done") || s.includes("geschlossen") || s.includes("abgeschlossen")) return "success";
    if (s.includes("offen") || s.includes("neu")) return "info";
    return "neutral";
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

export default function AkteDetailPage() {
    const router = useRouter();
    const params = useParams();

    const akteId = useMemo(() => safeNumber((params as any)?.akteId), [params]);

    const [akte, setAkte] = React.useState<AkteResponse | null>(null);
    const [faelle, setFaelle] = React.useState<FallListResponse | null>(null);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    // Meldung-Status je Fall (current Meldung)
    const [meldungStatusByFallId, setMeldungStatusByFallId] = React.useState<Record<number, string>>({});
    const [loadingMeldungStates, setLoadingMeldungStates] = React.useState(false);

    // Context/UI State
    const [context, setContext] = React.useState<ContextActive | null>(null);
    const [contextRequired, setContextRequired] = React.useState(false);
    const [contextHint, setContextHint] = React.useState<string | null>(null);
    const [switchingContext, setSwitchingContext] = React.useState(false);

    const loadContext = React.useCallback(async () => {
        try {
            const ctx = await apiFetch<ContextResponse>(`/auth/context`, { method: "GET" });
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

            const a = await apiFetch<AkteResponse>(`/akten/${akteId}`, { method: "GET" });
            setAkte(a);

            const f = await apiFetch<FallListResponse>(`/akten/${akteId}/faelle`, { method: "GET" });
            setFaelle(f);

            // ✅ nach Laden der Fälle: Meldung-Status pro Fall laden
            const ids = (f?.items || []).map((x) => x.id);
            setLoadingMeldungStates(true);
            const map = await loadMeldungStatusByFallIds(ids);
            setMeldungStatusByFallId(map);
        } catch (e: any) {
            if (e instanceof ApiError && e.code === "CONTEXT_REQUIRED") {
                setContextRequired(true);
                setErr(null);

                const requested = extractRequestedEinrichtungId(e);
                if (requested) {
                    setContextHint(`Kontext erforderlich (Ziel-Einrichtung #${requested}).`);
                } else {
                    setContextHint("Kontext erforderlich. Bitte zur passenden Einrichtung wechseln.");
                }

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

    // ✅ RULE: solange irgendein Fall eine current Meldung ENTWURF hat => kein neuer Fall
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

        // ✅ HARTE UI-REGEL (so wie du es willst)
        if (hasDraftMeldungBlocking && fallWithDraftMeldung) {
            setErr(
                `Es gibt bereits eine Erstmeldung im Entwurf (${fallWithDraftMeldung.aktenzeichen || `Fall #${fallWithDraftMeldung.id}`}). ` +
                `Bitte diesen Entwurf zuerst fertigstellen oder löschen/abschließen.`
            );
            return;
        }

        const doCreate = async () => {
            const created = await apiFetch<CreateFallResponse>(`/akten/${akteId}/faelle`, {
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
                    setContextHint(
                        "Aktiver Kontext passt nicht zur Einrichtung dieser Akte. Bitte Kontext wechseln und erneut versuchen."
                    );
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
        loading ||
        !akteId ||
        switchingContext ||
        contextRequired ||
        loadingMeldungStates ||
        hasDraftMeldungBlocking;

    return (
        <AuthGate>
            <div className="min-h-screen bg-background">
                <Topbar title="Akte" />

                <div className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="secondary" onClick={() => router.back()} className="w-full sm:w-auto gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Zurück
                        </Button>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Button variant="secondary" onClick={load} disabled={loading} className="w-full sm:w-auto gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Aktualisieren
                            </Button>

                            <Button
                                onClick={createFall}
                                disabled={createFallDisabled}
                                className="w-full sm:w-auto gap-2"
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

                    {hasDraftMeldungBlocking && fallWithDraftMeldung ? (
                        <div className="rounded-2xl border border-border bg-muted p-3 text-sm text-muted-foreground">
                            Es existiert bereits eine Meldung im <span className="font-semibold">ENTWURF</span> für{" "}
                            <span className="font-semibold">{fallWithDraftMeldung.aktenzeichen || `Fall #${fallWithDraftMeldung.id}`}</span>.
                            Solange dieser Entwurf existiert, kann kein neuer Fall angelegt werden.
                        </div>
                    ) : null}

                    {err ? (
                        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                            {err}
                        </div>
                    ) : null}

                    {contextRequired ? (
                        <div className="rounded-2xl border border-brand-warning/25 bg-brand-warning/10 p-3 text-sm text-brand-text space-y-2">
                            <div className="font-semibold">Kontext erforderlich</div>
                            <div className="text-brand-text2">
                                {contextHint ||
                                    "Aktiver Kontext passt nicht zur Einrichtung dieser Akte. Bitte Kontext wechseln und erneut versuchen."}
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

                                <div className="text-xs text-brand-text2">
                                    Aktuell: Einrichtung #{context?.einrichtungOrgUnitId ?? "—"}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold">Details</div>
                                <div className="mt-1 text-xs text-muted-foreground">KindDossier (1 pro Kind)</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{loading ? "…" : akteId ? `#${akteId}` : "—"}</div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-sm text-muted-foreground">Lade…</div>
                            ) : !akte ? (
                                <div className="text-sm text-muted-foreground">Keine Akte geladen.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">Kind</div>
                                        <div className="mt-1 text-sm font-extrabold break-words">{akte.kindName || `Kind #${akte.kindId}`}</div>
                                        <div className="mt-1 text-xs text-muted-foreground">Kind-ID: {akte.kindId}</div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-card p-3">
                                        <div className="text-xs font-semibold text-muted-foreground">Erstellt</div>
                                        <div className="mt-1 text-sm font-semibold break-words">{akte.createdAt || "—"}</div>

                                        {typeof akte.einrichtungOrgUnitId === "number" ? (
                                            <div className="mt-1 text-xs text-muted-foreground">Einrichtung: #{akte.einrichtungOrgUnitId}</div>
                                        ) : null}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <div className="text-sm font-semibold">Fälle</div>
                                <div className="mt-1 text-xs text-muted-foreground">Mehrere Fälle pro Akte</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{loading ? "…" : `${total} Einträge`}</div>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            {!fallItems.length ? (
                                <div className="rounded-2xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                                    {contextRequired
                                        ? "Fälle können erst geladen werden, nachdem der Kontext zur passenden Einrichtung gewechselt wurde."
                                        : "Noch keine Fälle in dieser Akte. Erstelle den ersten Fall über „Neuer Fall (Erstmeldung)“."}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {fallItems.map((f) => {
                                        const ms = (meldungStatusByFallId[f.id] || "").toUpperCase();
                                        const msIsDraft = ms === "ENTWURF" || ms === "DRAFT";

                                        return (
                                            <div key={f.id} className="rounded-2xl border border-border bg-card p-3">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold break-words">
                                                            {f.fallNo ? `Fall ${f.fallNo}` : "Fall"} · {f.aktenzeichen || `#${f.id}`}
                                                        </div>
                                                        <div className="mt-1 text-xs text-muted-foreground">Eröffnet: {f.openedAt || f.createdAt || "—"}</div>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge tone={toneForStatus(f.status)}>{f.status || "—"}</Badge>

                                                        {loadingMeldungStates ? (
                                                            <Badge tone="neutral">Meldung…</Badge>
                                                        ) : msIsDraft ? (
                                                            <Badge tone="warning">Meldung ENTWURF</Badge>
                                                        ) : ms ? (
                                                            <Badge tone="neutral">Meldung {ms}</Badge>
                                                        ) : (
                                                            <Badge tone="neutral">Keine Meldung</Badge>
                                                        )}

                                                        <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/falloeffnungen/${f.id}`)}>
                                                            Details
                                                        </Button>

                                                        <Button size="sm" onClick={() => router.push(`/dashboard/falloeffnungen/${f.id}/meldung`)} className="gap-2">
                                                            Draft weiterführen
                                                            <ArrowRight className="h-4 w-4" />
                                                        </Button>
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