"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";
import { riskIndicatorsApi, type TraegerRiskIndicator } from "@/lib/riskIndicatorsApi";
import { anlassCatalogApi, type AnlasskatalogEntry } from "@/lib/anlassCatalogApi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader as ShadDialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { CheckCircle2, Circle, Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";

/* ── Severity dot ────────────────────────────────────────── */

function SeverityDot({ s }: { s: number | null | undefined }) {
    if (s == null) return <span className="text-xs text-brand-text2/40">—</span>;
    const cls = s === 3 ? "bg-red-500" : s === 2 ? "bg-amber-400" : s === 1 ? "bg-yellow-300" : "bg-brand-border";
    return (
        <span className="inline-flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />
            <span className="text-xs text-brand-text2">{s}</span>
        </span>
    );
}

/* ── Editor state ────────────────────────────────────────── */

type EditState = {
    id?: number;
    indicatorId: string;
    label: string;
    description: string;
    category: string;
    enabled: boolean;
    defaultSeverity: number | null;
};

function editFromIndicator(x: TraegerRiskIndicator): EditState {
    return {
        id: x.id,
        indicatorId: x.indicatorId,
        label: x.label,
        description: x.description ?? "",
        category: x.category ?? "",
        enabled: x.enabled,
        defaultSeverity: x.defaultSeverity ?? null,
    };
}

function editFromCatalog(e: AnlasskatalogEntry): EditState {
    return {
        indicatorId: e.code,
        label: e.label,
        description: "",
        category: e.category ?? "",
        enabled: true,
        defaultSeverity: e.defaultSeverity ?? null,
    };
}

/* ── New catalog entry state ─────────────────────────────── */

type NewEntryState = {
    code: string;
    label: string;
    category: string;
    defaultSeverity: number | null;
};

const emptyNewEntry = (): NewEntryState => ({
    code: "", label: "", category: "", defaultSeverity: null,
});

/* ── Page ────────────────────────────────────────────────── */

export default function RiskConfigPage() {
    const { me } = useAuth();
    const traegerId = me?.traegerId ?? null;
    const isTraegerAdmin = useMemo(() => (me?.roles || []).includes("TRAEGER_ADMIN"), [me?.roles]);

    // DB catalog (global)
    const [catalog, setCatalog] = useState<AnlasskatalogEntry[]>([]);
    // Träger indicators (activated subset)
    const [dbItems, setDbItems] = useState<TraegerRiskIndicator[]>([]);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [q, setQ] = useState("");

    // Edit existing indicator dialog
    const [editOpen, setEditOpen] = useState(false);
    const [editor, setEditor] = useState<EditState | null>(null);

    // New catalog entry dialog
    const [newEntryOpen, setNewEntryOpen] = useState(false);
    const [newEntry, setNewEntry] = useState<NewEntryState>(emptyNewEntry());
    const [similar, setSimilar] = useState<AnlasskatalogEntry[]>([]);
    const [similarChecked, setSimilarChecked] = useState(false);
    const [exactMatch, setExactMatch] = useState(false);

    const dbByCode = useMemo(() => new Map(dbItems.map((x) => [x.indicatorId, x])), [dbItems]);

    // Group catalog by category
    const catalogByCategory = useMemo(() => {
        const s = q.trim().toLowerCase();
        const filtered = s
            ? catalog.filter((e) =>
                e.code.toLowerCase().includes(s) ||
                e.label.toLowerCase().includes(s) ||
                (e.category ?? "").toLowerCase().includes(s)
            )
            : catalog;

        const groups = new Map<string, AnlasskatalogEntry[]>();
        for (const e of filtered) {
            const cat = e.category ?? "Sonstiges";
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat)!.push(e);
        }
        return groups;
    }, [catalog, q]);

    const activeCount = dbItems.filter((x) => x.enabled).length;

    async function refresh() {
        setErr(null);
        setLoading(true);
        try {
            const [cat, indicators] = await Promise.all([
                anlassCatalogApi.list(),
                traegerId
                    ? (isTraegerAdmin
                        ? riskIndicatorsApi.adminList(traegerId)
                        : riskIndicatorsApi.listForMe())
                    : Promise.resolve([]),
            ]);
            setCatalog(cat);
            setDbItems(indicators);
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

    // Quick toggle: activate / deactivate from catalog
    async function quickToggle(entry: AnlasskatalogEntry) {
        if (!traegerId || !isTraegerAdmin) return;
        const existing = dbByCode.get(entry.code);
        setBusy(true);
        setErr(null);
        try {
            if (!existing) {
                const created = await riskIndicatorsApi.adminCreate(traegerId, {
                    indicatorId: entry.code,
                    label: entry.label,
                    category: entry.category ?? null,
                    enabled: true,
                    defaultSeverity: entry.defaultSeverity ?? null,
                });
                setDbItems((prev) => [...prev, created]);
            } else {
                const updated = await riskIndicatorsApi.adminUpdate(traegerId, existing.id, {
                    enabled: !existing.enabled,
                });
                setDbItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            }
        } catch (e: any) {
            setErr(e?.message || "Fehler");
        } finally {
            setBusy(false);
        }
    }

    // Open edit dialog for an already-activated indicator
    function openEdit(x: TraegerRiskIndicator) {
        setEditor(editFromIndicator(x));
        setEditOpen(true);
    }

    async function saveEdit() {
        if (!traegerId || !editor?.id) return;
        setBusy(true);
        setErr(null);
        try {
            const updated = await riskIndicatorsApi.adminUpdate(traegerId, editor.id, {
                label: editor.label.trim(),
                description: editor.description || null,
                category: editor.category || null,
                enabled: editor.enabled,
                defaultSeverity: editor.defaultSeverity,
            });
            setDbItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
            setEditOpen(false);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Speichern");
        } finally {
            setBusy(false);
        }
    }

    async function removeIndicator(x: TraegerRiskIndicator) {
        if (!traegerId || !isTraegerAdmin) return;
        if (!confirm(`Indikator entfernen?\n${x.label} (${x.indicatorId})`)) return;
        setBusy(true);
        setErr(null);
        try {
            await riskIndicatorsApi.adminDelete(traegerId, x.id);
            setDbItems((prev) => prev.filter((p) => p.id !== x.id));
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Löschen");
        } finally {
            setBusy(false);
        }
    }

    // New catalog entry: check similarity on label/code change
    async function checkSimilar(label: string, code: string) {
        if (!label.trim() && !code.trim()) {
            setSimilar([]);
            setSimilarChecked(false);
            setExactMatch(false);
            return;
        }
        try {
            const res = await anlassCatalogApi.similar({ label, code });
            setSimilar(res.similar);
            setExactMatch(res.exactMatch);
            setSimilarChecked(true);
        } catch {
            // ignore similarity errors
        }
    }

    // Debounced similarity check
    const similarTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    function onNewEntryChange(patch: Partial<NewEntryState>) {
        const next = { ...newEntry, ...patch };
        setNewEntry(next);
        setSimilarChecked(false);
        if (similarTimer.current) clearTimeout(similarTimer.current);
        similarTimer.current = setTimeout(() => checkSimilar(next.label, next.code), 400);
    }

    async function submitNewEntry() {
        if (!newEntry.code.trim() || !newEntry.label.trim()) return;
        setBusy(true);
        setErr(null);
        try {
            const created = await anlassCatalogApi.create({
                code: newEntry.code.trim(),
                label: newEntry.label.trim(),
                category: newEntry.category.trim() || null,
                defaultSeverity: newEntry.defaultSeverity,
            });
            setCatalog((prev) => [...prev, created].sort((a, b) =>
                (a.category ?? "").localeCompare(b.category ?? "") || a.label.localeCompare(b.label)
            ));
            setNewEntryOpen(false);
            setNewEntry(emptyNewEntry());
            setSimilar([]);
            setSimilarChecked(false);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Anlegen");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-brand-text">Risk-Konfiguration</h1>
                    <p className="text-sm text-brand-text2">
                        §8a-Anlass-Katalog — {catalog.length} Codes · {activeCount} aktiv für diesen Träger.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <Button variant="secondary" onClick={refresh} disabled={loading || busy}>
                        Aktualisieren
                    </Button>
                    {isTraegerAdmin && (
                        <Button
                            onClick={() => { setNewEntry(emptyNewEntry()); setSimilar([]); setSimilarChecked(false); setNewEntryOpen(true); }}
                            disabled={busy}
                            className="gap-1.5"
                        >
                            <Plus className="h-4 w-4" />
                            Neuer Code
                        </Button>
                    )}
                </div>
            </div>

            {err && (
                <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-4 text-sm text-brand-danger">
                    {err}
                </div>
            )}

            <Card>
                <CardHeader className="border-b pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <CardTitle>Anlass-Katalog</CardTitle>
                            <CardDescription className="mt-0.5">
                                {isTraegerAdmin
                                    ? "Kreis anklicken zum Aktivieren / Deaktivieren."
                                    : "Read-only Ansicht."}
                            </CardDescription>
                        </div>
                    </div>
                    <Input
                        className="mt-3 max-w-md"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Suche nach Code oder Label…"
                    />
                </CardHeader>

                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6 text-sm text-brand-text2">Lade…</div>
                    ) : catalogByCategory.size === 0 ? (
                        <div className="p-6 text-sm text-brand-text2">Keine Einträge gefunden.</div>
                    ) : (
                        Array.from(catalogByCategory.entries()).map(([cat, entries]) => (
                            <div key={cat}>
                                <div className="border-b border-t border-brand-border/60 bg-brand-bg/60 px-4 py-2">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-brand-text2/70">
                                        {cat}
                                    </span>
                                </div>
                                {entries.map((entry) => {
                                    const db = dbByCode.get(entry.code) ?? null;
                                    const isActive = db?.enabled === true;
                                    const isAdded = db != null;
                                    return (
                                        <div
                                            key={entry.code}
                                            className={
                                                "flex items-center gap-3 border-b border-brand-border/30 px-4 py-2.5 last:border-b-0 " +
                                                (isActive ? "bg-white" : "bg-brand-bg/20")
                                            }
                                        >
                                            {/* Toggle */}
                                            {isTraegerAdmin ? (
                                                <button
                                                    onClick={() => quickToggle(entry)}
                                                    disabled={busy}
                                                    className="shrink-0 transition hover:scale-110 focus:outline-none"
                                                    title={isActive ? "Deaktivieren" : isAdded ? "Aktivieren" : "Hinzufügen"}
                                                >
                                                    {isActive
                                                        ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                        : <Circle className="h-5 w-5 text-brand-text2/30 hover:text-brand-text2" />
                                                    }
                                                </button>
                                            ) : (
                                                <span className="shrink-0">
                                                    {isActive
                                                        ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                        : <Circle className="h-5 w-5 text-brand-text2/20" />
                                                    }
                                                </span>
                                            )}

                                            {/* Label + code */}
                                            <div className="min-w-0 flex-1">
                                                <span className={
                                                    "text-sm " +
                                                    (isActive ? "font-semibold text-brand-text" : "text-brand-text2")
                                                }>
                                                    {db?.label ?? entry.label}
                                                </span>
                                                <span className="ml-2 font-mono text-[11px] text-brand-text2/40">
                                                    {entry.code}
                                                </span>
                                                {db?.description && (
                                                    <div className="mt-0.5 text-xs text-brand-text2">{db.description}</div>
                                                )}
                                            </div>

                                            {/* Severity */}
                                            <SeverityDot s={db?.defaultSeverity ?? entry.defaultSeverity} />

                                            {/* Edit / remove (only if activated) */}
                                            {isTraegerAdmin && isAdded && (
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button
                                                        onClick={() => openEdit(db!)}
                                                        disabled={busy}
                                                        className="rounded-lg p-1.5 text-brand-text2 transition hover:bg-brand-bg hover:text-brand-text"
                                                        title="Beschriftung anpassen"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeIndicator(db!)}
                                                        disabled={busy}
                                                        className="rounded-lg p-1.5 text-brand-text2 transition hover:bg-red-50 hover:text-red-600"
                                                        title="Entfernen"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* ── Edit indicator dialog ── */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <ShadDialogHeader>
                        <DialogTitle>Indikator anpassen</DialogTitle>
                    </ShadDialogHeader>
                    {editor && (
                        <div className="space-y-3">
                            <div className="rounded-lg border border-brand-border/60 bg-brand-bg px-3 py-2 font-mono text-xs text-brand-text2">
                                {editor.indicatorId}
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-brand-text2 mb-1">Label</div>
                                <Input
                                    value={editor.label}
                                    onChange={(e) => setEditor((s) => s && ({ ...s, label: e.target.value }))}
                                />
                            </div>
                            <div>
                                <div className="text-xs font-semibold text-brand-text2 mb-1">Beschreibung (optional)</div>
                                <textarea
                                    className="w-full min-h-[72px] rounded-xl border border-brand-border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
                                    value={editor.description}
                                    onChange={(e) => setEditor((s) => s && ({ ...s, description: e.target.value }))}
                                    placeholder="Interne Hinweise…"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <div className="text-xs font-semibold text-brand-text2 mb-1">Default Severity</div>
                                    <select
                                        className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none"
                                        value={editor.defaultSeverity ?? ""}
                                        onChange={(e) => setEditor((s) => s && ({
                                            ...s,
                                            defaultSeverity: e.target.value === "" ? null : Number(e.target.value),
                                        }))}
                                    >
                                        <option value="">— keine —</option>
                                        <option value="0">0 – kein</option>
                                        <option value="1">1 – gering</option>
                                        <option value="2">2 – erhöht</option>
                                        <option value="3">3 – kritisch</option>
                                    </select>
                                </div>
                                <div className="flex items-end pb-1">
                                    <label className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editor.enabled}
                                            onChange={(e) => setEditor((s) => s && ({ ...s, enabled: e.target.checked }))}
                                            className="h-4 w-4 rounded border-brand-border"
                                        />
                                        Aktiv
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter className="mt-2">
                        <DialogClose asChild>
                            <Button variant="secondary" disabled={busy}>Abbrechen</Button>
                        </DialogClose>
                        <Button onClick={saveEdit} disabled={busy}>
                            {busy ? "Speichere…" : "Speichern"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── New catalog entry dialog ── */}
            <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
                <DialogContent className="max-w-lg">
                    <ShadDialogHeader>
                        <DialogTitle>Neuen Anlass-Code anlegen</DialogTitle>
                    </ShadDialogHeader>
                    <div className="space-y-3">
                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">
                                Code <span className="text-brand-danger">*</span>
                                <span className="ml-1 font-normal">(wird zu UPPER_SNAKE_CASE normiert)</span>
                            </div>
                            <Input
                                placeholder="z.B. BODY_NEW_SYMPTOM"
                                value={newEntry.code}
                                onChange={(e) => onNewEntryChange({ code: e.target.value })}
                                className={exactMatch ? "border-red-400" : ""}
                            />
                            {exactMatch && (
                                <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Dieser Code existiert bereits im Katalog.
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">
                                Label <span className="text-brand-danger">*</span>
                            </div>
                            <Input
                                placeholder="z.B. Neues Symptom / Anzeichen"
                                value={newEntry.label}
                                onChange={(e) => onNewEntryChange({ label: e.target.value })}
                            />
                        </div>

                        {/* Similarity warning */}
                        {similarChecked && similar.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
                                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    Ähnliche Einträge gefunden — bitte prüfen:
                                </div>
                                <ul className="space-y-1">
                                    {similar.slice(0, 5).map((s) => (
                                        <li key={s.code} className="text-xs text-amber-800">
                                            <span className="font-mono text-amber-600">{s.code}</span>
                                            {" — "}{s.label}
                                            <span className="ml-1 text-amber-500">({s.category})</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="text-xs text-amber-600">
                                    Falls keiner dieser Codes passt, kannst du trotzdem fortfahren.
                                </div>
                            </div>
                        )}

                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">Kategorie</div>
                            <Input
                                placeholder="z.B. Körperbezogene Anlässe"
                                value={newEntry.category}
                                onChange={(e) => onNewEntryChange({ category: e.target.value })}
                            />
                        </div>
                        <div>
                            <div className="text-xs font-semibold text-brand-text2 mb-1">Default Severity</div>
                            <select
                                className="w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none"
                                value={newEntry.defaultSeverity ?? ""}
                                onChange={(e) => onNewEntryChange({
                                    defaultSeverity: e.target.value === "" ? null : Number(e.target.value),
                                })}
                            >
                                <option value="">— keine —</option>
                                <option value="0">0 – kein</option>
                                <option value="1">1 – gering</option>
                                <option value="2">2 – erhöht</option>
                                <option value="3">3 – kritisch</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter className="mt-2">
                        <DialogClose asChild>
                            <Button variant="secondary" disabled={busy}>Abbrechen</Button>
                        </DialogClose>
                        <Button
                            onClick={submitNewEntry}
                            disabled={busy || exactMatch || !newEntry.code.trim() || !newEntry.label.trim()}
                        >
                            {busy ? "Speichere…" : "Anlegen"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
