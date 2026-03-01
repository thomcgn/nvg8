"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
    erstmeldungApi,
    type ErstmeldungResponse,
    type ErstmeldungDraftRequest,
    type ErstmeldungCloneRequest,
    type ErstmeldungVersionListItemResponse,
} from "@/lib/api/erstmeldung";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import { ErstmeldungVersionSidebar } from "@/components/erstmeldung/ErstmeldungVersionSidebar";
import { ErstmeldungEditor } from "@/components/erstmeldung/ErstmeldungEditor";

function parseFallId(param: unknown): number | null {
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

// Option A: Backend liefert 404, wenn noch keine current Erstmeldung existiert.
// Wir interpretieren das als "noch nicht gestartet" und legen automatisch eine leere Version an.
function isNoCurrentErstmeldungError(e: unknown): boolean {
    const msg = e && typeof e === "object" && "message" in e ? String((e as any).message) : "";
    return msg.includes("No current Erstmeldung") || msg.includes('"title":"NOT_FOUND"') || msg.includes("NOT_FOUND");
}

export default function ErstmeldungPage() {
    const params = useParams();
    const router = useRouter();

    const fallId = parseFallId((params as any)?.fallId);

    const [loading, setLoading] = React.useState(true);
    const [err, setErr] = React.useState<string | null>(null);

    const [current, setCurrent] = React.useState<ErstmeldungResponse | null>(null);
    const [versions, setVersions] = React.useState<ErstmeldungVersionListItemResponse[]>([]);
    const [activeErstmeldungId, setActiveErstmeldungId] = React.useState<number | null>(null);

    // ✅ Guard gegen doppelte refresh() Calls (StrictMode / Doppel-Render / Button-Spam)
    const refreshInFlightRef = React.useRef(false);
    // ✅ Auto-create newVersion nur 1× pro Mount, sonst Duplicate-Key Risiko
    const autoCreateAttemptedRef = React.useRef(false);
    // ✅ schützt vor "setState nach unmount"
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
            // 1) Versions laden (kann auch leer sein)
            const v = await erstmeldungApi.versions(fallId);
            if (!mountedRef.current) return;
            setVersions(v);

            // 2) Current laden
            try {
                const c = await erstmeldungApi.current(fallId);
                if (!mountedRef.current) return;
                setCurrent(c);
                setActiveErstmeldungId(c.id);
            } catch (e: any) {
                // 3) Falls es noch keine current Erstmeldung gibt:
                //    -> nur einmal pro Mount automatisch newVersion anlegen (sonst Duplicate-Key)
                if (isNoCurrentErstmeldungError(e) && !autoCreateAttemptedRef.current) {
                    autoCreateAttemptedRef.current = true;

                    const em = await erstmeldungApi.newVersion(fallId);
                    if (!mountedRef.current) return;
                    setCurrent(em);
                    setActiveErstmeldungId(em.id);

                    // Versionsliste nach Erstellung aktualisieren
                    const v2 = await erstmeldungApi.versions(fallId);
                    if (!mountedRef.current) return;
                    setVersions(v2);
                } else {
                    throw e;
                }
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

    const loadVersion = async (erstmeldungId: number) => {
        if (!fallId) return;
        setErr(null);
        setLoading(true);
        try {
            const em = await erstmeldungApi.get(fallId, erstmeldungId);
            setCurrent(em);
            setActiveErstmeldungId(erstmeldungId);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Laden der Version");
        } finally {
            setLoading(false);
        }
    };

    const createNewVersion = async () => {
        if (!fallId) return;
        setErr(null);
        setLoading(true);
        try {
            const em = await erstmeldungApi.newVersion(fallId);
            setCurrent(em);
            setActiveErstmeldungId(em.id);
            const v = await erstmeldungApi.versions(fallId);
            setVersions(v);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Erstellen");
        } finally {
            setLoading(false);
        }
    };

    const [cloneCfg, setCloneCfg] = React.useState<ErstmeldungCloneRequest>({
        includeAnlaesse: true,
        includeObservations: true,
        includeObservationTags: true,
        includeJugendamt: false,
        includeContacts: true,
        includeExtern: true,
        includeAttachments: true,
        carryOverFachlicheEinschaetzung: false,
    });

    const cloneCurrent = async () => {
        if (!fallId) return;
        setErr(null);
        setLoading(true);
        try {
            const em = await erstmeldungApi.cloneCurrent(fallId, cloneCfg);
            setCurrent(em);
            setActiveErstmeldungId(em.id);
            const v = await erstmeldungApi.versions(fallId);
            setVersions(v);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Klonen");
        } finally {
            setLoading(false);
        }
    };

    const saveDraft = async (req: ErstmeldungDraftRequest) => {
        if (!fallId || !current) return;
        setErr(null);
        try {
            const em = await erstmeldungApi.saveDraft(fallId, current.id, req);
            setCurrent(em);
            const v = await erstmeldungApi.versions(fallId);
            setVersions(v);
            return em;
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Speichern");
            throw e;
        }
    };

    const submit = async (mirrorObservationsToNotizen: boolean, recomputeRisk: boolean) => {
        if (!fallId || !current) return;
        setErr(null);
        setLoading(true);
        try {
            const em = await erstmeldungApi.submit(fallId, current.id, {
                mirrorObservationsToNotizen,
                recomputeRisk,
            });
            setCurrent(em);
            const v = await erstmeldungApi.versions(fallId);
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
        <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">§8a Erstmeldung</h1>
                    <p className="text-sm text-muted-foreground">
                        Fall #{fallId} — Versionierung, Draft, Clone, Notiz-Tagging, Submit
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        Zurück
                    </Button>
                    <Button variant="secondary" onClick={refresh} disabled={loading}>
                        Aktualisieren
                    </Button>
                </div>
            </div>

            {err && (
                <div className="mb-4">
                    <Alert>
                        <AlertTitle>Fehler</AlertTitle>
                        <AlertDescription className="break-words">{err}</AlertDescription>
                    </Alert>
                </div>
            )}

            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 lg:col-span-4">
                    <ErstmeldungVersionSidebar
                        loading={loading}
                        versions={versions}
                        activeErstmeldungId={activeErstmeldungId}
                        onSelectVersion={loadVersion}
                        onNewVersion={createNewVersion}
                    />

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Clone aktuelle Erstmeldung</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-sm text-muted-foreground">
                                Erzeugt eine neue Version und setzt sie als{" "}
                                <Badge variant="secondary">current</Badge>. Abschlussfelder werden zurückgesetzt.
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Anlässe</Label>
                                    <Switch
                                        checked={cloneCfg.includeAnlaesse}
                                        onCheckedChange={(v) => setCloneCfg((s) => ({ ...s, includeAnlaesse: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Observations</Label>
                                    <Switch
                                        checked={cloneCfg.includeObservations}
                                        onCheckedChange={(v) => setCloneCfg((s) => ({ ...s, includeObservations: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Obs. Tags</Label>
                                    <Switch
                                        checked={cloneCfg.includeObservationTags}
                                        onCheckedChange={(v) =>
                                            setCloneCfg((s) => ({ ...s, includeObservationTags: v }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Jugendamt</Label>
                                    <Switch
                                        checked={cloneCfg.includeJugendamt}
                                        onCheckedChange={(v) => setCloneCfg((s) => ({ ...s, includeJugendamt: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Kontakte</Label>
                                    <Switch
                                        checked={cloneCfg.includeContacts}
                                        onCheckedChange={(v) => setCloneCfg((s) => ({ ...s, includeContacts: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Extern</Label>
                                    <Switch
                                        checked={cloneCfg.includeExtern}
                                        onCheckedChange={(v) => setCloneCfg((s) => ({ ...s, includeExtern: v }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Attachments</Label>
                                    <Switch
                                        checked={cloneCfg.includeAttachments}
                                        onCheckedChange={(v) =>
                                            setCloneCfg((s) => ({ ...s, includeAttachments: v }))
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <Label>Fach-Ampel</Label>
                                    <Switch
                                        checked={cloneCfg.carryOverFachlicheEinschaetzung}
                                        onCheckedChange={(v) =>
                                            setCloneCfg((s) => ({ ...s, carryOverFachlicheEinschaetzung: v }))
                                        }
                                    />
                                </div>
                            </div>

                            <Button onClick={cloneCurrent} className="w-full" disabled={loading || !current}>
                                Clone & neue Version
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-12 lg:col-span-8">
                    <Card>
                        <CardHeader className="flex-row items-start justify-between gap-4">
                            <div>
                                <CardTitle>Editor</CardTitle>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    {loading ? (
                                        <span>Lade…</span>
                                    ) : current ? (
                                        <>
                                            <span>Version {current.versionNo}</span>
                                            <Badge variant={current.status === "ABGESCHLOSSEN" ? "default" : "secondary"}>
                                                {current.status}
                                            </Badge>
                                            {current.current && <Badge variant="outline">current</Badge>}
                                            {current.supersedesId ? <span>— basiert auf #{current.supersedesId}</span> : null}
                                        </>
                                    ) : (
                                        <span>Keine Daten</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="outline" onClick={createNewVersion} disabled={loading}>
                                    Neue Version
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {!current ? (
                                <Alert>
                                    <AlertTitle>Keine Erstmeldung</AlertTitle>
                                    <AlertDescription>
                                        Es existiert noch keine Erstmeldung. (Option A) Wird beim Laden automatisch als
                                        leere Version angelegt – oder erstelle manuell eine neue Version.
                                    </AlertDescription>
                                </Alert>
                            ) : (
                                <ErstmeldungEditor
                                    key={current.id}
                                    value={current}
                                    disabled={current.status === "ABGESCHLOSSEN"}
                                    onSaveDraft={saveDraft}
                                    onSubmit={submit}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-base">Hinweis</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Das Instrument dient als <strong>Unterstützung</strong>. Schwellenwerte werden durch
                            Fachkräfte pro Träger konfiguriert. Jede Observation kann mehreren Indikatoren
                            zugeordnet werden.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}