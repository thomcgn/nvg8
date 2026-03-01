"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { Topbar } from "@/components/layout/Topbar";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { meldungApi, type MeldungListItemResponse, type MeldungResponse, type MeldungDraftRequest } from "@/lib/api/meldung";

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
    if (s.includes("abgeschlossen") || s.includes("done")) return "success";
    if (s.includes("entwurf") || s.includes("draft")) return "info";
    return "neutral";
}

function fmtInstant(x: string | null | undefined) {
    if (!x) return "—";
    try {
        const d = new Date(x);
        return d.toLocaleString();
    } catch {
        return x;
    }
}

export default function FallMeldungenPage() {
    const params = useParams();
    const router = useRouter();

    const fallId = parseId((params as any)?.fallId);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const [versions, setVersions] = React.useState<MeldungListItemResponse[]>([]);
    const [current, setCurrent] = React.useState<MeldungResponse | null>(null);
    const [activeMeldungId, setActiveMeldungId] = React.useState<number | null>(null);

    const [draftKurz, setDraftKurz] = React.useState("");

    const refreshInFlightRef = React.useRef(false);
    const mountedRef = React.useRef(true);

    React.useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const refresh = React.useCallback(async () => {
        if (!fallId) return;
        if (refreshInFlightRef.current) return;

        refreshInFlightRef.current = true;
        setErr(null);
        setLoading(true);

        try {
            const v = await meldungApi.list(fallId);
            if (!mountedRef.current) return;
            setVersions(v);

            try {
                const c = await meldungApi.current(fallId);
                if (!mountedRef.current) return;
                setCurrent(c);
                setActiveMeldungId(c.id);
                setDraftKurz(c.kurzbeschreibung ?? "");
            } catch (e: any) {
                if (!mountedRef.current) return;
                setCurrent(null);
                setActiveMeldungId(null);
                setDraftKurz("");
            }
        } catch (e: any) {
            if (!mountedRef.current) return;
            setErr(e?.message || "Fehler beim Laden");
        } finally {
            if (!mountedRef.current) return;
            setLoading(false);
            refreshInFlightRef.current = false;
        }
    }, [fallId]);

    React.useEffect(() => {
        refresh();
    }, [refresh]);

    const loadVersion = async (meldungId: number) => {
        if (!fallId) return;
        setErr(null);
        setLoading(true);
        try {
            const m = await meldungApi.get(fallId, meldungId);
            setCurrent(m);
            setActiveMeldungId(meldungId);
            setDraftKurz(m.kurzbeschreibung ?? "");
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Laden der Meldung");
        } finally {
            setLoading(false);
        }
    };

    const createNew = async () => {
        if (!fallId) return;
        setErr(null);
        setLoading(true);
        try {
            const m = await meldungApi.createNew(fallId, null);
            setCurrent(m);
            setActiveMeldungId(m.id);
            setDraftKurz(m.kurzbeschreibung ?? "");
            const v = await meldungApi.list(fallId);
            setVersions(v);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Erstellen");
        } finally {
            setLoading(false);
        }
    };

    const saveDraft = async () => {
        if (!fallId || !current) return;
        setErr(null);
        setLoading(true);
        try {
            const req: MeldungDraftRequest = {
                kurzbeschreibung: draftKurz.trim() || null,
            };
            const m = await meldungApi.saveDraft(fallId, current.id, req);
            setCurrent(m);
            setDraftKurz(m.kurzbeschreibung ?? "");
            const v = await meldungApi.list(fallId);
            setVersions(v);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Speichern");
        } finally {
            setLoading(false);
        }
    };

    const submit = async () => {
        if (!fallId || !current) return;
        setErr(null);
        setLoading(true);
        try {
            const m = await meldungApi.submit(fallId, current.id, { mirrorToNotizen: true });
            setCurrent(m);
            const v = await meldungApi.list(fallId);
            setVersions(v);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Abschließen");
        } finally {
            setLoading(false);
        }
    };

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
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar title={`Fall #${fallId}`} />

                <div className="mx-auto w-full max-w-6xl space-y-4 px-4 pb-8 pt-4 sm:space-y-6 sm:px-6 md:px-8">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm text-brand-text2">Erstmeldung / Meldungen</div>
                            <div className="text-xl font-semibold text-brand-navy">Versionierung · Draft · Submit</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" onClick={() => router.back()}>
                                Zurück
                            </Button>
                            <Button variant="secondary" onClick={refresh} disabled={loading}>
                                Aktualisieren
                            </Button>
                            <Button onClick={createNew} disabled={loading}>
                                Neue Meldung
                            </Button>
                        </div>
                    </div>

                    {err ? (
                        <Alert>
                            <AlertTitle>Fehler</AlertTitle>
                            <AlertDescription className="break-words">{err}</AlertDescription>
                        </Alert>
                    ) : null}

                    <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-12 lg:col-span-4">
                            <Card>
                                <CardHeader className="flex-row items-center justify-between">
                                    <div className="text-sm font-semibold text-brand-text">Versionen</div>
                                    <div className="text-xs text-brand-text2">{loading ? "lädt…" : `${versions.length} Einträge`}</div>
                                </CardHeader>

                                <CardContent className="space-y-2">
                                    {!versions.length ? (
                                        <div className="text-sm text-brand-text2">Noch keine Meldungen vorhanden.</div>
                                    ) : (
                                        <div className="space-y-2">
                                            {versions.map((v) => (
                                                <button
                                                    key={v.id}
                                                    onClick={() => loadVersion(v.id)}
                                                    className={
                                                        "w-full rounded-xl border p-3 text-left transition " +
                                                        (activeMeldungId === v.id
                                                            ? "border-brand-teal bg-brand-teal/10"
                                                            : "border-brand-border bg-white hover:bg-brand-bg")
                                                    }
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="text-sm font-semibold text-brand-navy">
                                                            v{v.versionNo} {v.current ? "· current" : ""}
                                                        </div>
                                                        <Badge tone={badgeTone(v.status)}>{v.status}</Badge>
                                                    </div>

                                                    <div className="mt-1 text-xs text-brand-text2">
                                                        {v.type} · erstellt: {fmtInstant(v.createdAt)}
                                                    </div>

                                                    {v.supersedesId ? (
                                                        <div className="mt-1 text-xs text-brand-text2">basiert auf #{v.supersedesId}</div>
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <Separator className="my-2" />

                                    <Button className="w-full" onClick={createNew} disabled={loading}>
                                        Neue Meldung anlegen
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="col-span-12 lg:col-span-8">
                            <Card>
                                <CardHeader className="flex-row items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-semibold text-brand-text">Details</div>
                                        <div className="mt-1 text-xs text-brand-text2">
                                            Backend: <code className="rounded bg-brand-bg px-1">/falloeffnungen/{fallId}/meldungen</code>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {current ? (
                                            <>
                                                <Badge tone={badgeTone(current.status)}>{current.status}</Badge>
                                                {current.current ? <Badge tone="info">current</Badge> : null}
                                            </>
                                        ) : (
                                            <Badge tone="neutral">keine Meldung</Badge>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    {!current ? (
                                        <Alert>
                                            <AlertTitle>Noch keine Meldung</AlertTitle>
                                            <AlertDescription>
                                                Lege über <strong>Neue Meldung</strong> eine erste Meldung an.
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <>
                                            <div className="space-y-2">
                                                <Label htmlFor="kurz">Kurzbeschreibung (Draft)</Label>
                                                <Textarea
                                                    id="kurz"
                                                    value={draftKurz}
                                                    onChange={(e) => setDraftKurz(e.target.value)}
                                                    className="min-h-[120px]"
                                                    disabled={loading || current.status === "ABGESCHLOSSEN"}
                                                />
                                                <div className="flex gap-2">
                                                    <Button onClick={saveDraft} disabled={loading || current.status === "ABGESCHLOSSEN"}>
                                                        Draft speichern
                                                    </Button>
                                                    <Button variant="secondary" onClick={submit} disabled={loading || current.status === "ABGESCHLOSSEN"}>
                                                        Abschließen (submit)
                                                    </Button>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="rounded-xl border border-brand-border bg-white p-3">
                                                <div className="text-xs font-semibold text-brand-text2">Raw (Debug)</div>
                                                <pre className="mt-2 max-h-[360px] overflow-auto text-xs text-brand-navy">
{JSON.stringify(current, null, 2)}
                        </pre>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGate>
    );
}