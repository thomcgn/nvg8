"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { TopbarConnected as Topbar } from "@/components/layout/TopbarConnected";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    CheckCircle2,
    Circle,
    Pencil,
    Trash2,
    Plus,
    AlertTriangle,
    ChevronDown,
    ChevronsUpDown,
    RefreshCw,
    ShieldAlert,
    Info,
} from "lucide-react";

/* ── Severity dot ────────────────────────────────────────── */

function SeverityDot({ s }: { s: number | null | undefined }) {
    if (s == null) return <span className="text-xs text-brand-text2/40">—</span>;

    const cls =
        s === 3
            ? "bg-red-500"
            : s === 2
                ? "bg-amber-400"
                : s === 1
                    ? "bg-yellow-300"
                    : "bg-brand-border";

    return (
        <span className="inline-flex min-w-[60px] items-center justify-end gap-1.5">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />
            <span className="text-xs tabular-nums text-brand-text2">{s}</span>
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

/* ── New catalog entry state ─────────────────────────────── */

type NewEntryState = {
    code: string;
    label: string;
    category: string;
    defaultSeverity: number | null;
};

const emptyNewEntry = (): NewEntryState => ({
    code: "",
    label: "",
    category: "",
    defaultSeverity: null,
});

/* ── Helpers ─────────────────────────────────────────────── */

type CategoryGroup = {
    category: string;
    entries: AnlasskatalogEntry[];
    total: number;
    active: number;
};

function normalizeSearch(v: string) {
    return v.trim().toLowerCase();
}

/* ── Page ────────────────────────────────────────────────── */

export default function RiskConfigPage() {
    const { me } = useAuth();
    const traegerId = me?.traegerId ?? null;
    const isTraegerAdmin = useMemo(() => (me?.roles || []).includes("TRAEGER_ADMIN"), [me?.roles]);

    const [catalog, setCatalog] = useState<AnlasskatalogEntry[]>([]);
    const [dbItems, setDbItems] = useState<TraegerRiskIndicator[]>([]);

    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [q, setQ] = useState("");

    const [editOpen, setEditOpen] = useState(false);
    const [editor, setEditor] = useState<EditState | null>(null);

    const [newEntryOpen, setNewEntryOpen] = useState(false);
    const [newEntry, setNewEntry] = useState<NewEntryState>(emptyNewEntry());
    const [similar, setSimilar] = useState<AnlasskatalogEntry[]>([]);
    const [similarChecked, setSimilarChecked] = useState(false);
    const [exactMatch, setExactMatch] = useState(false);

    const [openCats, setOpenCats] = useState<Record<string, boolean>>({});

    const similarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dbByCode = useMemo(() => new Map(dbItems.map((x) => [x.indicatorId, x])), [dbItems]);

    const filteredGroups = useMemo<CategoryGroup[]>(() => {
        const s = normalizeSearch(q);

        const filtered = s
            ? catalog.filter((e) => {
                const code = e.code.toLowerCase();
                const label = e.label.toLowerCase();
                const category = (e.category ?? "").toLowerCase();
                return code.includes(s) || label.includes(s) || category.includes(s);
            })
            : catalog;

        const groups = new Map<string, AnlasskatalogEntry[]>();

        for (const e of filtered) {
            const cat = e.category?.trim() || "Sonstiges";
            if (!groups.has(cat)) groups.set(cat, []);
            groups.get(cat)!.push(e);
        }

        const result: CategoryGroup[] = Array.from(groups.entries()).map(([category, entries]) => {
            const sortedEntries = [...entries].sort((a, b) => {
                const aActive = dbByCode.get(a.code)?.enabled === true ? 1 : 0;
                const bActive = dbByCode.get(b.code)?.enabled === true ? 1 : 0;
                return bActive - aActive || a.label.localeCompare(b.label) || a.code.localeCompare(b.code);
            });

            const active = sortedEntries.filter((e) => dbByCode.get(e.code)?.enabled === true).length;

            return {
                category,
                entries: sortedEntries,
                total: sortedEntries.length,
                active,
            };
        });

        return result.sort((a, b) => {
            const aHasActive = a.active > 0 ? 1 : 0;
            const bHasActive = b.active > 0 ? 1 : 0;
            return bHasActive - aHasActive || b.active - a.active || a.category.localeCompare(b.category);
        });
    }, [catalog, dbByCode, q]);

    const activeCount = dbItems.filter((x) => x.enabled).length;
    const searchActive = q.trim().length > 0;
    const totalLabel = loading ? "…" : `${catalog.length} Codes · ${activeCount} aktiv`;

    useEffect(() => {
        setOpenCats((prev) => {
            const next = { ...prev };
            for (const group of filteredGroups) {
                if (!(group.category in next)) {
                    next[group.category] = searchActive || group.active > 0;
                } else if (searchActive) {
                    next[group.category] = true;
                }
            }
            return next;
        });
    }, [filteredGroups, searchActive]);

    useEffect(() => {
        return () => {
            if (similarTimer.current) clearTimeout(similarTimer.current);
        };
    }, []);

    async function refresh() {
        setErr(null);
        setLoading(true);

        try {
            const [cat, indicators] = await Promise.all([
                anlassCatalogApi.list(),
                traegerId
                    ? isTraegerAdmin
                        ? riskIndicatorsApi.adminList(traegerId)
                        : riskIndicatorsApi.listForMe()
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

    function setAllCategories(open: boolean) {
        setOpenCats(
            filteredGroups.reduce<Record<string, boolean>>((acc, g) => {
                acc[g.category] = open;
                return acc;
            }, {})
        );
    }

    function toggleCategory(category: string, nextOpen: boolean) {
        setOpenCats((prev) => ({ ...prev, [category]: nextOpen }));
    }

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
        if (!x.enabled) return;
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
            // similarity check should not block UI
        }
    }

    function onNewEntryChange(patch: Partial<NewEntryState>) {
        const next = { ...newEntry, ...patch };
        setNewEntry(next);
        setSimilarChecked(false);

        if (similarTimer.current) clearTimeout(similarTimer.current);
        similarTimer.current = setTimeout(() => {
            checkSimilar(next.label, next.code);
        }, 400);
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

            setCatalog((prev) =>
                [...prev, created].sort(
                    (a, b) =>
                        (a.category ?? "").localeCompare(b.category ?? "") ||
                        a.label.localeCompare(b.label) ||
                        a.code.localeCompare(b.code)
                )
            );

            setOpenCats((prev) => ({
                ...prev,
                [created.category?.trim() || "Sonstiges"]: true,
            }));

            setNewEntryOpen(false);
            setNewEntry(emptyNewEntry());
            setSimilar([]);
            setSimilarChecked(false);
            setExactMatch(false);
        } catch (e: any) {
            setErr(e?.message || "Fehler beim Anlegen");
        } finally {
            setBusy(false);
        }
    }

    return (
        <AuthGate>
            <div className="min-h-screen bg-brand-bg overflow-x-hidden">
                <Topbar
                    title="Risk-Konfiguration"
                    onSearch={(val) => {
                        setQ(val);
                    }}
                />

                <div className="mx-auto w-full max-w-7xl px-3 pb-12 pt-4 sm:px-6 space-y-4">
                    {err ? (
                        <div className="rounded-2xl border border-brand-danger/20 bg-brand-danger/10 p-3 text-sm text-brand-danger">
                            {err}
                        </div>
                    ) : null}

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 shadow-sm">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 rounded-xl bg-white/70 p-2 ring-1 ring-amber-200">
                                <Info className="h-4 w-4 text-amber-700" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-sm font-semibold text-amber-900">Hinweis</div>
                                <div className="mt-1 text-sm leading-6 text-amber-900/90">
                                    Diese Konfiguration dient ausschließlich der automatisierten Ampel-Unterstützung im
                                    System. Sie ersetzt weder die fachliche Gefährdungseinschätzung noch die
                                    Verantwortungsübernahme der zuständigen Fachkraft im Verfahren nach §8a SGB VIII.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-brand-border/40 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-brand-text2" />
                                <div className="min-w-0">
                                    <div className="truncate text-base font-semibold text-brand-text">
                                        §8a Anlass-Katalog
                                    </div>
                                    <div className="mt-1 truncate text-sm text-brand-text2">{totalLabel}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                                <Button
                                    variant="secondary"
                                    onClick={refresh}
                                    disabled={loading || busy}
                                    className="h-11 gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Aktualisieren
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => setAllCategories(true)}
                                    disabled={loading}
                                    className="h-11 gap-2"
                                >
                                    <ChevronsUpDown className="h-4 w-4" />
                                    Alle öffnen
                                </Button>

                                <Button
                                    variant="secondary"
                                    onClick={() => setAllCategories(false)}
                                    disabled={loading}
                                    className="h-11"
                                >
                                    Alle schließen
                                </Button>

                                {isTraegerAdmin && (
                                    <Button
                                        onClick={() => {
                                            setNewEntry(emptyNewEntry());
                                            setSimilar([]);
                                            setSimilarChecked(false);
                                            setExactMatch(false);
                                            setNewEntryOpen(true);
                                        }}
                                        disabled={busy}
                                        className="h-11 gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Neuer Code
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <Card className="overflow-hidden border border-brand-border/40 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between gap-3">
                            <div className="min-w-0">
                                <CardTitle className="text-base">Kategorien</CardTitle>
                                <CardDescription className="mt-1">
                                    {isTraegerAdmin
                                        ? "Suche läuft über die Topbar. Aktivieren links. Bearbeiten und Entfernen nur bei aktivem Eintrag."
                                        : "Read-only Ansicht."}
                                </CardDescription>
                            </div>
                            <div className="shrink-0 text-xs text-brand-text2">
                                {loading ? "…" : `${filteredGroups.length} Kategorien`}
                            </div>
                        </CardHeader>

                        <CardContent className="bg-brand-bg/20 p-3 sm:p-4">
                            {loading ? (
                                <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                    Lade…
                                </div>
                            ) : filteredGroups.length === 0 ? (
                                <div className="rounded-2xl border border-brand-border/40 bg-white p-4 text-sm text-brand-text2">
                                    {q.trim()
                                        ? "Keine Einträge zu dieser Suche gefunden."
                                        : "Keine Einträge vorhanden."}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredGroups.map((group) => {
                                        const isOpen = openCats[group.category] ?? false;

                                        return (
                                            <Collapsible
                                                key={group.category}
                                                open={isOpen}
                                                onOpenChange={(nextOpen) => toggleCategory(group.category, nextOpen)}
                                            >
                                                <div className="overflow-hidden rounded-2xl border border-brand-border/40 bg-white shadow-sm">
                                                    <CollapsibleTrigger asChild>
                                                        <button
                                                            className="flex min-h-[72px] w-full items-center justify-between gap-3 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100 active:bg-slate-100"
                                                            aria-label={`Kategorie ${group.category} ${isOpen ? "schließen" : "öffnen"}`}
                                                        >
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className="text-sm font-semibold text-brand-text sm:text-[15px]">
                                                                        {group.category}
                                                                    </span>

                                                                    <span className="rounded-full border border-brand-border/70 bg-white px-2.5 py-0.5 text-[11px] font-medium text-brand-text2">
                                                                        {group.total} Einträge
                                                                    </span>

                                                                    {group.active > 0 && (
                                                                        <span className="rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
                                                                            {group.active} aktiv
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border/50 bg-white text-brand-text2 shadow-sm">
                                                                <ChevronDown
                                                                    className={`h-5 w-5 transition-transform ${
                                                                        isOpen ? "rotate-180" : ""
                                                                    }`}
                                                                />
                                                            </span>
                                                        </button>
                                                    </CollapsibleTrigger>

                                                    <CollapsibleContent>
                                                        <div className="divide-y divide-brand-border/30">
                                                            {group.entries.map((entry) => {
                                                                const db = dbByCode.get(entry.code) ?? null;
                                                                const isChecked = db?.enabled === true;
                                                                const canManage = isTraegerAdmin && isChecked && !!db;

                                                                return (
                                                                    <div
                                                                        key={entry.code}
                                                                        className={`grid grid-cols-[48px_minmax(0,1fr)_64px] gap-3 px-4 py-3 md:grid-cols-[56px_minmax(0,1fr)_72px_108px] ${
                                                                            isChecked ? "bg-white" : "bg-brand-bg/5"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-start pt-0.5">
                                                                            {isTraegerAdmin ? (
                                                                                <button
                                                                                    onClick={() => quickToggle(entry)}
                                                                                    disabled={busy}
                                                                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border/50 bg-white text-brand-text2 shadow-sm transition hover:bg-brand-bg hover:text-brand-text active:scale-[0.98] disabled:opacity-50"
                                                                                    title={
                                                                                        isChecked
                                                                                            ? "Deaktivieren"
                                                                                            : "Aktivieren"
                                                                                    }
                                                                                    aria-label={
                                                                                        isChecked
                                                                                            ? `Eintrag ${entry.label} deaktivieren`
                                                                                            : `Eintrag ${entry.label} aktivieren`
                                                                                    }
                                                                                >
                                                                                    {isChecked ? (
                                                                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                                                    ) : (
                                                                                        <Circle className="h-6 w-6 text-brand-text2/40" />
                                                                                    )}
                                                                                </button>
                                                                            ) : (
                                                                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border/30 bg-slate-50">
                                                                                    {isChecked ? (
                                                                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                                                    ) : (
                                                                                        <Circle className="h-6 w-6 text-brand-text2/25" />
                                                                                    )}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0">
                                                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                                <span
                                                                                    className={`text-sm leading-5 ${
                                                                                        isChecked
                                                                                            ? "font-semibold text-brand-text"
                                                                                            : "font-medium text-brand-text2"
                                                                                    }`}
                                                                                >
                                                                                    {db?.label ?? entry.label}
                                                                                </span>

                                                                                <span className="rounded-md bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-brand-text2/60 ring-1 ring-brand-border/40">
                                                                                    {entry.code}
                                                                                </span>
                                                                            </div>

                                                                            {db?.description && (
                                                                                <div className="mt-1 line-clamp-3 text-xs leading-5 text-brand-text2">
                                                                                    {db.description}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-start justify-end pt-1 md:justify-center">
                                                                            <SeverityDot
                                                                                s={db?.defaultSeverity ?? entry.defaultSeverity}
                                                                            />
                                                                        </div>

                                                                        <div className="col-span-3 flex justify-end md:col-span-1 md:justify-center">
                                                                            {canManage ? (
                                                                                <div className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => openEdit(db)}
                                                                                        disabled={busy}
                                                                                        title="Beschriftung anpassen"
                                                                                        aria-label={`Eintrag ${db.label} bearbeiten`}
                                                                                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-border/60 bg-white text-brand-text2 shadow-sm transition hover:bg-brand-bg hover:text-brand-text active:scale-[0.98] disabled:opacity-50"
                                                                                    >
                                                                                        <Pencil className="h-5 w-5" />
                                                                                    </button>

                                                                                    <button
                                                                                        onClick={() => removeIndicator(db)}
                                                                                        disabled={busy}
                                                                                        title="Entfernen"
                                                                                        aria-label={`Eintrag ${db.label} entfernen`}
                                                                                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-white text-brand-text2 shadow-sm transition hover:bg-red-50 hover:text-red-600 active:scale-[0.98] disabled:opacity-50"
                                                                                    >
                                                                                        <Trash2 className="h-5 w-5" />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="h-11 w-[94px]" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </CollapsibleContent>
                                                </div>
                                            </Collapsible>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="max-w-[640px] rounded-2xl">
                        <ShadDialogHeader>
                            <DialogTitle>Indikator anpassen</DialogTitle>
                        </ShadDialogHeader>

                        {editor && (
                            <div className="space-y-4">
                                <div className="rounded-xl border border-brand-border/60 bg-brand-bg px-3 py-2 font-mono text-xs text-brand-text2">
                                    {editor.indicatorId}
                                </div>

                                <div>
                                    <div className="mb-1.5 text-xs font-semibold text-brand-text2">Label</div>
                                    <Input
                                        className="h-11 rounded-xl"
                                        value={editor.label}
                                        onChange={(e) => setEditor((s) => s && ({ ...s, label: e.target.value }))}
                                    />
                                </div>

                                <div>
                                    <div className="mb-1.5 text-xs font-semibold text-brand-text2">
                                        Beschreibung (optional)
                                    </div>
                                    <textarea
                                        className="min-h-[96px] w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-teal/30"
                                        value={editor.description}
                                        onChange={(e) =>
                                            setEditor((s) => s && ({ ...s, description: e.target.value }))
                                        }
                                        placeholder="Interne Hinweise…"
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div>
                                        <div className="mb-1.5 text-xs font-semibold text-brand-text2">
                                            Default Severity
                                        </div>
                                        <select
                                            className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none"
                                            value={editor.defaultSeverity ?? ""}
                                            onChange={(e) =>
                                                setEditor((s) =>
                                                        s && ({
                                                            ...s,
                                                            defaultSeverity:
                                                                e.target.value === "" ? null : Number(e.target.value),
                                                        })
                                                )
                                            }
                                        >
                                            <option value="">— keine —</option>
                                            <option value="0">0 – kein</option>
                                            <option value="1">1 – gering</option>
                                            <option value="2">2 – erhöht</option>
                                            <option value="3">3 – kritisch</option>
                                        </select>
                                    </div>

                                    <div className="flex items-end pb-1">
                                        <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-text">
                                            <input
                                                type="checkbox"
                                                checked={editor.enabled}
                                                onChange={(e) =>
                                                    setEditor((s) => s && ({ ...s, enabled: e.target.checked }))
                                                }
                                                className="h-4 w-4 rounded border-brand-border"
                                            />
                                            Aktiv
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="mt-2 gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary" disabled={busy} className="h-11 rounded-xl">
                                    Abbrechen
                                </Button>
                            </DialogClose>
                            <Button onClick={saveEdit} disabled={busy} className="h-11 rounded-xl">
                                {busy ? "Speichere…" : "Speichern"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={newEntryOpen} onOpenChange={setNewEntryOpen}>
                    <DialogContent className="max-w-[640px] rounded-2xl">
                        <ShadDialogHeader>
                            <DialogTitle>Neuen Anlass-Code anlegen</DialogTitle>
                        </ShadDialogHeader>

                        <div className="space-y-4">
                            <div>
                                <div className="mb-1.5 text-xs font-semibold text-brand-text2">
                                    Code <span className="text-brand-danger">*</span>
                                    <span className="ml-1 font-normal">(wird zu UPPER_SNAKE_CASE normiert)</span>
                                </div>
                                <Input
                                    className={`h-11 rounded-xl ${exactMatch ? "border-red-400" : ""}`}
                                    placeholder="z. B. BODY_NEW_SYMPTOM"
                                    value={newEntry.code}
                                    onChange={(e) => onNewEntryChange({ code: e.target.value })}
                                />
                                {exactMatch && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                                        <AlertTriangle className="h-3.5 w-3.5" />
                                        Dieser Code existiert bereits im Katalog.
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="mb-1.5 text-xs font-semibold text-brand-text2">
                                    Label <span className="text-brand-danger">*</span>
                                </div>
                                <Input
                                    className="h-11 rounded-xl"
                                    placeholder="z. B. Neues Symptom / Anzeichen"
                                    value={newEntry.label}
                                    onChange={(e) => onNewEntryChange({ label: e.target.value })}
                                />
                            </div>

                            {similarChecked && similar.length > 0 && (
                                <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-700">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        Ähnliche Einträge gefunden — bitte prüfen:
                                    </div>

                                    <ul className="space-y-1.5">
                                        {similar.slice(0, 5).map((s) => (
                                            <li key={s.code} className="text-xs leading-5 text-amber-800">
                                                <span className="font-mono text-amber-700">{s.code}</span>
                                                {" — "}
                                                {s.label}
                                                <span className="ml-1 text-amber-600">
                                                    ({s.category || "Sonstiges"})
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="text-xs text-amber-700">
                                        Falls keiner dieser Codes passt, kannst du trotzdem fortfahren.
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="mb-1.5 text-xs font-semibold text-brand-text2">Kategorie</div>
                                <Input
                                    className="h-11 rounded-xl"
                                    placeholder="z. B. Körperbezogene Anlässe"
                                    value={newEntry.category}
                                    onChange={(e) => onNewEntryChange({ category: e.target.value })}
                                />
                            </div>

                            <div>
                                <div className="mb-1.5 text-xs font-semibold text-brand-text2">
                                    Default Severity
                                </div>
                                <select
                                    className="h-11 w-full rounded-xl border border-brand-border bg-white px-3 py-2 text-sm outline-none"
                                    value={newEntry.defaultSeverity ?? ""}
                                    onChange={(e) =>
                                        onNewEntryChange({
                                            defaultSeverity: e.target.value === "" ? null : Number(e.target.value),
                                        })
                                    }
                                >
                                    <option value="">— keine —</option>
                                    <option value="0">0 – kein</option>
                                    <option value="1">1 – gering</option>
                                    <option value="2">2 – erhöht</option>
                                    <option value="3">3 – kritisch</option>
                                </select>
                            </div>
                        </div>

                        <DialogFooter className="mt-2 gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary" disabled={busy} className="h-11 rounded-xl">
                                    Abbrechen
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={submitNewEntry}
                                disabled={busy || exactMatch || !newEntry.code.trim() || !newEntry.label.trim()}
                                className="h-11 rounded-xl"
                            >
                                {busy ? "Speichere…" : "Anlegen"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AuthGate>
    );
}