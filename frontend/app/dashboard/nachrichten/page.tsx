"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import type { InboxItem } from "@/lib/types";
import {
    fetchInbox,
    markRead,
    sendMessage,
    fetchRecipientOptions,
    type RecipientOption,
} from "@/lib/messagesClient";
import { useUnreadCount } from "@/hooks/useUnreadCount";

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

function cn(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

export default function NachrichtenPage() {
    const [items, setItems] = useState<InboxItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<InboxItem | null>(null);
    const [q, setQ] = useState("");

    // Compose state
    const [composeOpen, setComposeOpen] = useState(false);
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);

    // Recipient dropdown state
    const [recipientQuery, setRecipientQuery] = useState("");
    const [recipientOptions, setRecipientOptions] = useState<RecipientOption[]>([]);
    const [recipientLoading, setRecipientLoading] = useState(false);
    const [selectedRecipients, setSelectedRecipients] = useState<RecipientOption[]>([]);

    const { refreshUnreadCount } = useUnreadCount();

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        if (!needle) return items;
        return items.filter((it) => {
            const s = it.message.subject?.toLowerCase() ?? "";
            const p = it.message.bodyPreview?.toLowerCase() ?? "";
            const sender = (it.message.senderName ?? "").toLowerCase();
            return s.includes(needle) || p.includes(needle) || sender.includes(needle);
        });
    }, [items, q]);

    async function loadInbox() {
        setLoading(true);
        try {
            const data = await fetchInbox(50);
            setItems(data);

            if (data.length === 0) {
                setSelected(null);
            } else if (selected) {
                const stillThere = data.find((x) => x.recipientRowId === selected.recipientRowId);
                setSelected(stillThere ?? data[0]);
            } else {
                setSelected(data[0]);
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadInbox().catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Load / filter recipients when compose dialog is open (with debounce)
    useEffect(() => {
        if (!composeOpen) return;

        let alive = true;
        const t = setTimeout(async () => {
            setRecipientLoading(true);
            try {
                // If your backend ignores q, it will still return all users.
                // For large user bases, make backend accept ?q= and filter there.
                const opts = await fetchRecipientOptions(recipientQuery);
                if (alive) setRecipientOptions(opts);
            } catch {
                if (alive) setRecipientOptions([]);
            } finally {
                if (alive) setRecipientLoading(false);
            }
        }, 250);

        return () => {
            alive = false;
            clearTimeout(t);
        };
    }, [composeOpen, recipientQuery]);

    function toggleRecipient(opt: RecipientOption) {
        setSelectedRecipients((prev) =>
            prev.some((x) => x.id === opt.id) ? prev.filter((x) => x.id !== opt.id) : [...prev, opt]
        );
    }

    async function selectItem(item: InboxItem) {
        setSelected(item);

        if (!item.isRead) {
            setItems((prev) =>
                prev.map((x) => (x.recipientRowId === item.recipientRowId ? { ...x, isRead: true } : x))
            );

            try {
                await markRead(item.recipientRowId, true);
            } catch {
                setItems((prev) =>
                    prev.map((x) =>
                        x.recipientRowId === item.recipientRowId ? { ...x, isRead: false } : x
                    )
                );
            } finally {
                refreshUnreadCount().catch(() => {});
            }
        }
    }

    async function handleSend() {
        const recipientUserIds = selectedRecipients.map((r) => r.id);

        if (recipientUserIds.length === 0) {
            alert("Bitte mindestens einen Empfänger auswählen.");
            return;
        }
        if (!subject.trim()) {
            alert("Bitte Betreff angeben.");
            return;
        }
        if (!body.trim()) {
            alert("Bitte Nachrichtentext angeben.");
            return;
        }

        setSending(true);
        try {
            await sendMessage({
                recipientUserIds,
                subject: subject.trim(),
                body: body.trim(),
                threadId: null,
            });

            // reset + close
            setSubject("");
            setBody("");
            setSelectedRecipients([]);
            setRecipientQuery("");
            setComposeOpen(false);

            await loadInbox();
            await refreshUnreadCount();
        } catch {
            alert("Senden fehlgeschlagen.");
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <h1 className="text-lg sm:text-xl font-semibold">Nachrichten</h1>
                    <p className="text-sm text-muted-foreground">Inbox · interne Nachrichten wie E-Mail</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => loadInbox().catch(() => {})} disabled={loading}>
                        Aktualisieren
                    </Button>

                    <Dialog
                        open={composeOpen}
                        onOpenChange={(open) => {
                            setComposeOpen(open);
                            if (!open) {
                                // optional: keep selection; but we clear search to avoid confusion
                                setRecipientQuery("");
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button>Neue Nachricht</Button>
                        </DialogTrigger>

                        <DialogContent className="sm:max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Neue Nachricht</DialogTitle>
                            </DialogHeader>

                            <div className="space-y-3">
                                {/* Recipients dropdown / searchable list */}
                                <div className="space-y-1">
                                    <label className="text-sm text-muted-foreground">Empfänger</label>

                                    {/* Selected chips */}
                                    {selectedRecipients.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedRecipients.map((r) => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => toggleRecipient(r)}
                                                    className="text-xs rounded-full border px-2 py-1 hover:bg-muted"
                                                    title="Entfernen"
                                                    disabled={sending}
                                                >
                                                    {r.label} ✕
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <Input
                                        value={recipientQuery}
                                        onChange={(e) => setRecipientQuery(e.target.value)}
                                        placeholder="Suchen nach Name…"
                                        disabled={sending}
                                    />

                                    <div className="max-h-56 overflow-auto rounded-md border">
                                        {recipientLoading ? (
                                            <p className="text-sm text-muted-foreground p-2">Lade…</p>
                                        ) : recipientOptions.length === 0 ? (
                                            <p className="text-sm text-muted-foreground p-2">Keine Treffer.</p>
                                        ) : (
                                            <div className="flex flex-col">
                                                {recipientOptions.map((opt) => {
                                                    const active = selectedRecipients.some((x) => x.id === opt.id);
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            onClick={() => toggleRecipient(opt)}
                                                            className={cn(
                                                                "text-left px-3 py-2 hover:bg-muted border-b last:border-b-0",
                                                                active && "bg-muted"
                                                            )}
                                                            disabled={sending}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="truncate">{opt.label}</span>
                                                                {active && (
                                                                    <span className="text-xs text-muted-foreground">ausgewählt</span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-muted-foreground">Betreff</label>
                                    <Input
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder="Betreff"
                                        disabled={sending}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm text-muted-foreground">Nachricht</label>
                                    <Textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="Schreib deine Nachricht…"
                                        className="min-h-45"
                                        disabled={sending}
                                    />
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={sending}>
                                        Abbrechen
                                    </Button>
                                    <Button onClick={handleSend} disabled={sending}>
                                        {sending ? "Sende…" : "Senden"}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: list */}
                <Card className="p-3 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-3">
                        <Input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Suche (Betreff/Text/Sender)…"
                        />
                    </div>

                    {loading ? (
                        <p className="text-sm text-muted-foreground p-2">Lade…</p>
                    ) : filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-2">Keine Nachrichten.</p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {filtered.map((it) => {
                                const isSelected = selected?.recipientRowId === it.recipientRowId;
                                return (
                                    <button
                                        key={it.recipientRowId}
                                        onClick={() => selectItem(it)}
                                        className={cn(
                                            "text-left rounded-lg border p-3 transition",
                                            isSelected && "bg-muted",
                                            !it.isRead && "border-foreground/20"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {!it.isRead && (
                                                        <span className="inline-block w-2 h-2 rounded-full bg-destructive" />
                                                    )}
                                                    <p className={cn("truncate", !it.isRead && "font-semibold")}>
                                                        {it.message.subject}
                                                    </p>
                                                </div>

                                                <p className="text-xs text-muted-foreground truncate">
                                                    {it.message.senderName
                                                        ? `Von: ${it.message.senderName}`
                                                        : `Von User #${it.message.senderId}`}
                                                    {" · "}
                                                    {formatDate(it.message.createdAt)}
                                                </p>

                                                <p className="text-sm text-muted-foreground truncate mt-1">
                                                    {it.message.bodyPreview}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Card>

                {/* Right: detail */}
                <Card className="p-4 lg:col-span-2">
                    {!selected ? (
                        <p className="text-sm text-muted-foreground">Wähle links eine Nachricht aus.</p>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <h2 className="text-lg font-semibold wrap-break-word">{selected.message.subject}</h2>
                                    <p className="text-sm text-muted-foreground">
                                        {selected.message.senderName
                                            ? `Von: ${selected.message.senderName}`
                                            : `Von User #${selected.message.senderId}`}
                                        {" · "}
                                        {formatDate(selected.message.createdAt)}
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={async () => {
                                        const newIsRead = !selected.isRead;

                                        setSelected((prev) => (prev ? { ...prev, isRead: newIsRead } : prev));
                                        setItems((prev) =>
                                            prev.map((x) =>
                                                x.recipientRowId === selected.recipientRowId ? { ...x, isRead: newIsRead } : x
                                            )
                                        );

                                        try {
                                            await markRead(selected.recipientRowId, newIsRead);
                                        } catch {
                                            setSelected((prev) => (prev ? { ...prev, isRead: !newIsRead } : prev));
                                            setItems((prev) =>
                                                prev.map((x) =>
                                                    x.recipientRowId === selected.recipientRowId
                                                        ? { ...x, isRead: !newIsRead }
                                                        : x
                                                )
                                            );
                                        } finally {
                                            refreshUnreadCount().catch(() => {});
                                        }
                                    }}
                                >
                                    {selected.isRead ? "Als ungelesen" : "Als gelesen"}
                                </Button>
                            </div>

                            <div className="border rounded-lg p-3 whitespace-pre-wrap">
                                {selected.message.bodyPreview}
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Hinweis: Aktuell zeigt die Detailansicht nur eine Vorschau. Wenn dein Backend einen Detail-Endpoint
                                liefert (z.B. <code>/messages/:recipientRowId</code>), kann hier der komplette Body geladen werden.
                            </p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}