"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Plus, ExternalLink } from "lucide-react";
import type { SupportTicket, TicketCategory, TicketPriority } from "@/lib/supportTickets";
import { createSupportTicket, fetchMyTickets } from "@/lib/supportTickets";

function badgeClass(status: string) {
    const s = status.toUpperCase();
    if (s === "RESOLVED" || s === "CLOSED") return "bg-emerald-500/15 text-emerald-700 border-emerald-500/20";
    if (s === "IN_PROGRESS") return "bg-amber-500/15 text-amber-700 border-amber-500/20";
    return "bg-brand-teal/15 text-brand-navy border-brand-teal/20";
}

export function TicketsModal({
                                 open,
                                 onClose,
                             }: {
    open: boolean;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<"list" | "new">("list");
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<TicketCategory>("OTHER");
    const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
    const [pageUrl, setPageUrl] = useState("");

    const canSubmit = useMemo(() => {
        return title.trim().length >= 4 && description.trim().length >= 10;
    }, [title, description]);

    async function loadTickets() {
        setErr("");
        setLoading(true);
        try {
            const data = await fetchMyTickets();
            setTickets(data);
        } catch (e: any) {
            // falls du GET noch nicht hast, kannst du die Liste erstmal ausblenden
            setErr(e?.message || "Tickets konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!open) return;
        setTab("list");
        loadTickets();
    }, [open]);

    async function submit() {
        setErr("");
        setLoading(true);
        try {
            const ua = typeof navigator !== "undefined" ? navigator.userAgent : undefined;
            const created = await createSupportTicket({
                title: title.trim(),
                description: description.trim(),
                category,
                priority,
                pageUrl: pageUrl?.trim() || window.location.pathname,
                userAgent: ua,
            });

            // Reset form
            setTitle("");
            setDescription("");
            setCategory("OTHER");
            setPriority("MEDIUM");
            setPageUrl("");

            // zurück zur Liste + refresh
            setTab("list");
            await loadTickets();

            // Optional: kleine UX-Hilfe
            if (created.githubIssueUrl) {
                // nichts erzwingen, aber du könntest Toast zeigen
            }
        } catch (e: any) {
            setErr(e?.message || "TicketsUIProvider.tsx konnte nicht erstellt werden.");
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <button
                aria-label="Close"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            {/* Panel */}
            <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-brand-border">
                <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
                    <div className="min-w-0">
                        <div className="text-lg font-extrabold text-brand-navy leading-tight">Tickets</div>
                        <div className="text-xs text-brand-text2">Support-Anfragen an Techniker/Dev-Team</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-xl border border-brand-border bg-white/80 hover:bg-brand-teal/15 transition grid place-items-center"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-5 pt-4">
                    <div className="inline-flex rounded-xl border border-brand-border bg-white/70 p-1">
                        <button
                            onClick={() => setTab("list")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                                tab === "list" ? "bg-brand-teal/15 text-brand-navy" : "text-brand-text2 hover:text-brand-navy"
                            }`}
                        >
                            Meine Tickets
                        </button>
                        <button
                            onClick={() => setTab("new")}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                                tab === "new" ? "bg-brand-teal/15 text-brand-navy" : "text-brand-text2 hover:text-brand-navy"
                            }`}
                        >
                            <Plus className="h-4 w-4" />
                            Neues Ticket
                        </button>
                    </div>
                </div>

                {err && (
                    <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {err}
                    </div>
                )}

                {/* Content */}
                <div className="px-5 py-4 overflow-y-auto h-[calc(100%-140px)]">
                    {tab === "list" ? (
                        <div className="space-y-3">
                            {loading && (
                                <div className="text-sm text-brand-text2">Lade Tickets…</div>
                            )}

                            {!loading && tickets.length === 0 && (
                                <div className="rounded-2xl border border-brand-border bg-brand-bg/60 p-4 text-sm text-brand-text2">
                                    Noch keine Tickets. Erstelle eins über <b>Neues Ticket</b>.
                                </div>
                            )}

                            {tickets.map((t) => (
                                <div
                                    key={t.id}
                                    className="rounded-2xl border border-brand-border bg-white/80 p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="font-bold text-brand-navy truncate">{t.title}</div>
                                            <div className="text-xs text-brand-text2 mt-1 line-clamp-2">
                                                {t.description}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-semibold ${badgeClass(t.status)}`}>
                          {t.status}
                        </span>
                                                <span className="inline-flex items-center rounded-full border border-brand-border px-2 py-1 text-[11px] font-semibold text-brand-text2">
                          {t.category}
                        </span>
                                                <span className="inline-flex items-center rounded-full border border-brand-border px-2 py-1 text-[11px] font-semibold text-brand-text2">
                          {t.priority}
                        </span>
                                            </div>
                                        </div>

                                        {t.githubIssueUrl && (
                                            <a
                                                href={t.githubIssueUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white/70 px-3 py-2 text-sm font-medium text-brand-text2 hover:bg-brand-teal/15 hover:text-brand-navy transition"
                                                title="GitHub Issue öffnen"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="rounded-2xl border border-brand-border bg-brand-bg/60 p-4 text-sm text-brand-text2">
                                Beschreibe kurz das Problem. Das wird als GitHub Issue fürs Technik-Team angelegt.
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-brand-text2">Titel</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="mt-1 h-11 w-full rounded-xl border border-brand-border bg-white/80 px-3 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    placeholder="z.B. Formular Teams speichert nicht"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-brand-text2">Beschreibung</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1 min-h-[120px] w-full rounded-xl border border-brand-border bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    placeholder={"Was passiert genau?\nSchritte zum reproduzieren?\nErwartet vs. Ist?\n"}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-semibold text-brand-text2">Kategorie</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as TicketCategory)}
                                        className="mt-1 h-11 w-full rounded-xl border border-brand-border bg-white/80 px-3 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    >
                                        <option value="TEAMS_FORM">Teams Formular</option>
                                        <option value="LOGIN">Login</option>
                                        <option value="OTHER">Sonstiges</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-brand-text2">Priorität</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as TicketPriority)}
                                        className="mt-1 h-11 w-full rounded-xl border border-brand-border bg-white/80 px-3 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    >
                                        <option value="LOW">Niedrig</option>
                                        <option value="MEDIUM">Mittel</option>
                                        <option value="HIGH">Hoch</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-brand-text2">Seite (optional)</label>
                                <input
                                    value={pageUrl}
                                    onChange={(e) => setPageUrl(e.target.value)}
                                    className="mt-1 h-11 w-full rounded-xl border border-brand-border bg-white/80 px-3 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    placeholder="z.B. /teams/form (leer = automatisch)"
                                />
                            </div>

                            <button
                                disabled={!canSubmit || loading}
                                onClick={submit}
                                className="
                  mt-2 inline-flex items-center justify-center
                  h-11 w-full rounded-xl
                  bg-brand-teal text-white font-bold
                  shadow-sm transition
                  disabled:opacity-50 disabled:cursor-not-allowed
                  hover:brightness-95 active:scale-[0.99]
                "
                            >
                                {loading ? "Sende…" : "TicketsUIProvider.tsx erstellen"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}