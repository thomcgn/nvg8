"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { riskIndicatorsApi, type TraegerRiskIndicator } from "@/lib/riskIndicatorsApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader as ShadDialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";

function clampSeverity(v: any): number | null {
    if (v === "" || v === null || v === undefined) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(3, Math.round(n)));
}

type EditorState = {
    id?: number;
    indicatorId: string;
    label: string;
    description: string;
    category: string;
    enabled: boolean;
    defaultSeverity: number | null;
};

function toEditor(x?: TraegerRiskIndicator | null): EditorState {
    return {
        id: x?.id,
        indicatorId: x?.indicatorId ?? "",
        label: x?.label ?? "",
        description: x?.description ?? "",
        category: x?.category ?? "",
        enabled: x?.enabled ?? true,
        defaultSeverity: x?.defaultSeverity ?? null,
    };
}

export default function RiskConfigPage() {
    const { me } = useAuth();
    const traegerId = me?.traegerId ?? null;

    const isTraegerAdmin = useMemo(() => (me?.roles || []).includes("TRAEGER_ADMIN"), [me?.roles]);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [items, setItems] = useState<TraegerRiskIndicator[]>([]);

    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return items;
        return items.filter((x) =>
            [x.indicatorId, x.label, x.category || "", x.description || ""].join(" ").toLowerCase().includes(s)
        );
    }, [items, q]);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editor, setEditor] = useState<EditorState>(toEditor(null));
    const [busy, setBusy] = useState(false);

    async function refresh() {
        if (!traegerId) return;
        setErr(null);
        setLoading(true);
        try {
            if (isTraegerAdmin) {
                setItems(await riskIndicatorsApi.adminList(traegerId));
            } else {
                setItems(await riskIndicatorsApi.listForMe());
            }
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Laden");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [traegerId, isTraegerAdmin]);

    function openCreate() {
        setEditor(toEditor(null));
        setDialogOpen(true);
    }

    function openEdit(x: TraegerRiskIndicator) {
        setEditor(toEditor(x));
        setDialogOpen(true);
    }

    async function save() {
        if (!traegerId) return;
        setErr(null);

        const indicatorId = editor.indicatorId.trim();
        const label = editor.label.trim();
        if (!indicatorId) return setErr("indicatorId ist erforderlich.");
        if (!label) return setErr("Label ist erforderlich.");

        setBusy(true);
        try {
            if (!isTraegerAdmin) throw new Error("Keine Berechtigung.");

            if (editor.id) {
                const updated = await riskIndicatorsApi.adminUpdate(traegerId, editor.id, {
                    indicatorId,
                    label,
                    description: editor.description || null,
                    category: editor.category || null,
                    enabled: editor.enabled,
                    defaultSeverity: editor.defaultSeverity,
                });
                setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            } else {
                const created = await riskIndicatorsApi.adminCreate(traegerId, {
                    indicatorId,
                    label,
                    description: editor.description || null,
                    category: editor.category || null,
                    enabled: editor.enabled,
                    defaultSeverity: editor.defaultSeverity,
                });
                setItems((prev) => [...prev, created].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.id - b.id)));
            }

            setDialogOpen(false);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Speichern");
        } finally {
            setBusy(false);
        }
    }

    async function remove(x: TraegerRiskIndicator) {
        if (!traegerId) return;
        if (!isTraegerAdmin) return setErr("Keine Berechtigung.");
        if (!confirm(`Indikator wirklich löschen?\n\n${x.label} (${x.indicatorId})`)) return;

        setErr(null);
        setBusy(true);
        try {
            await riskIndicatorsApi.adminDelete(traegerId, x.id);
            setItems((prev) => prev.filter((p) => p.id !== x.id));
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Löschen");
        } finally {
            setBusy(false);
        }
    }

    async function move(x: TraegerRiskIndicator, dir: -1 | 1) {
        if (!traegerId) return;
        if (!isTraegerAdmin) return setErr("Keine Berechtigung.");

        const idx = items.findIndex((p) => p.id === x.id);
        const j = idx + dir;
        if (idx < 0 || j < 0 || j >= items.length) return;

        const next = [...items];
        const tmp = next[idx];
        next[idx] = next[j];
        next[j] = tmp;

        setItems(next);

        try {
            await riskIndicatorsApi.adminReorder(traegerId, next.map((p) => p.id));
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Sortieren");
            await refresh();
        }
    }

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold text-brand-text">Risk-Konfiguration</h1>
                <p className="text-sm text-brand-text2">
                    Indikatoren pro Träger (für Observation-Tags & Ampel-Hilfe). Schwellenwerte legen Fachkräfte fest.
                </p>
            </div>

            {err ? (
                <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm text-brand-danger">
                    {err}
                </div>
            ) : null}

            <Card>
                <CardHeader className="border-b">
                    <CardTitle>Indikatoren</CardTitle>
                    <CardDescription>
                        {isTraegerAdmin ? "Du kannst Indikatoren anlegen, bearbeiten, sortieren, deaktivieren." : "Read-only Ansicht."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="max-w-md w-full">
                            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suche (id, label, Kategorie, Text)…" />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="secondary" onClick={refresh} disabled={loading || busy}>
                                Aktualisieren
                            </Button>
                            {isTraegerAdmin ? (
                                <Button onClick={openCreate} disabled={busy}>
                                    + Neu
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-brand-border bg-white">
                        <div className="grid grid-cols-12 gap-0 border-b border-brand-border bg-brand-bg px-4 py-2 text-xs font-semibold text-brand-text2">
                            <div className="col-span-4">Label</div>
                            <div className="col-span-3">IndicatorId</div>
                            <div className="col-span-2">Kategorie</div>
                            <div className="col-span-1">Default</div>
                            <div className="col-span-2 text-right">Aktion</div>
                        </div>

                        {loading ? (
                            <div className="p-4 text-sm text-brand-text2">Lade…</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-4 text-sm text-brand-text2">Keine Indikatoren.</div>
                        ) : (
                            filtered.map((x) => (
                                <div
                                    key={x.id}
                                    className="grid grid-cols-12 gap-0 items-start px-4 py-3 border-b border-brand-border last:border-b-0"
                                >
                                    <div className="col-span-4">
                                        <div className="flex items-center gap-2">
                                            <div className="font-semibold text-brand-text">{x.label}</div>
                                            {x.enabled ? (
                                                <Badge tone="success">aktiv</Badge>
                                            ) : (
                                                <Badge tone="danger">deaktiviert</Badge>
                                            )}
                                        </div>
                                        {x.description ? (
                                            <div className="mt-1 text-xs text-brand-text2 whitespace-pre-wrap">{x.description}</div>
                                        ) : null}
                                    </div>

                                    <div className="col-span-3 text-sm text-brand-text2 break-all">{x.indicatorId}</div>

                                    <div className="col-span-2 text-sm text-brand-text2">{x.category || "—"}</div>

                                    <div className="col-span-1 text-sm text-brand-text2">{x.defaultSeverity ?? "—"}</div>

                                    <div className="col-span-2 flex justify-end gap-2">
                                        {isTraegerAdmin ? (
                                            <>
                                                <Button variant="ghost" size="sm" onClick={() => move(x, -1)} disabled={busy}>
                                                    ↑
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => move(x, 1)} disabled={busy}>
                                                    ↓
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => openEdit(x)} disabled={busy}>
                                                    Bearbeiten
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={() => remove(x)} disabled={busy}>
                                                    Löschen
                                                </Button>
                                            </>
                                        ) : (
                                            <span className="text-xs text-brand-text2">—</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* shadcn Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <ShadDialogHeader>
                        <DialogTitle>{editor.id ? "Indikator bearbeiten" : "Indikator anlegen"}</DialogTitle>
                    </ShadDialogHeader>

                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">Indicator ID (stabil)</div>
                            <Input
                                value={editor.indicatorId}
                                onChange={(e) => setEditor((s) => ({ ...s, indicatorId: e.target.value }))}
                                placeholder="z.B. INJURY_UNEXPLAINED"
                            />
                            <div className="mt-1 text-xs text-brand-text2">
                                Wird später in Observation-Tags referenziert. Möglichst nicht ändern.
                            </div>
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">Label</div>
                            <Input
                                value={editor.label}
                                onChange={(e) => setEditor((s) => ({ ...s, label: e.target.value }))}
                                placeholder="z.B. Unerklärte Verletzungen"
                            />
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">Kategorie</div>
                            <Input
                                value={editor.category}
                                onChange={(e) => setEditor((s) => ({ ...s, category: e.target.value }))}
                                placeholder="z.B. Körperliche Gewalt"
                            />
                        </div>

                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">Beschreibung</div>
                            <textarea
                                className="w-full min-h-[90px] rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
                                value={editor.description}
                                onChange={(e) => setEditor((s) => ({ ...s, description: e.target.value }))}
                                placeholder="Kurze Erläuterung / Beispiele / Hinweise…"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-xs font-semibold text-brand-text2 mb-1">Default Severity (0..3)</div>
                                <Input
                                    type="number"
                                    min={0}
                                    max={3}
                                    value={editor.defaultSeverity ?? ""}
                                    onChange={(e) => setEditor((s) => ({ ...s, defaultSeverity: clampSeverity(e.target.value) }))}
                                    placeholder="optional"
                                />
                            </div>

                            <div className="flex items-end gap-2">
                                <label className="flex items-center gap-2 text-sm text-brand-text">
                                    <input
                                        type="checkbox"
                                        checked={editor.enabled}
                                        onChange={(e) => setEditor((s) => ({ ...s, enabled: e.target.checked }))}
                                    />
                                    Aktiv
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-2">
                        <DialogClose asChild>
                            <Button variant="secondary" className="w-full sm:w-auto" disabled={busy}>
                                Abbrechen
                            </Button>
                        </DialogClose>

                        <Button onClick={save} className="w-full sm:w-auto" disabled={busy}>
                            {busy ? "Speichere…" : "Speichern"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}