"use client";

import { useEffect, useState } from "react";
import {
    X,
    Plus,
    Inbox,
    Send,
    ArrowLeft,
    Trash2,
    CheckCheck,
} from "lucide-react";
import {
    fetchInbox,
    fetchSent,
    fetchDetail,
    fetchRecipientOptions,
    fetchGroupOptions,
    sendMessage,
    markRead,
    deleteFromInbox,
    formatMessageDate,
    type InboxItem,
    type SentItem,
    type MessageDetail,
    type UserOption,
    type GroupOption,
} from "@/lib/messenger";

type Tab = "inbox" | "sent" | "compose";
type View = "list" | "detail";

export function MessengerModal({
    open,
    onClose,
    onUnreadChange,
}: {
    open: boolean;
    onClose: () => void;
    onUnreadChange?: () => void;
}) {
    const [tab, setTab] = useState<Tab>("inbox");
    const [view, setView] = useState<View>("list");

    const [inbox, setInbox] = useState<InboxItem[]>([]);
    const [sent, setSent] = useState<SentItem[]>([]);
    const [detail, setDetail] = useState<MessageDetail | null>(null);
    const [recipients, setRecipients] = useState<UserOption[]>([]);
    const [groups, setGroups] = useState<GroupOption[]>([]);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Compose state
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
    const [sending, setSending] = useState(false);

    async function loadInbox() {
        setErr("");
        setLoading(true);
        try {
            const data = await fetchInbox();
            setInbox(data);
        } catch {
            setErr("Posteingang konnte nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    async function loadSent() {
        setErr("");
        setLoading(true);
        try {
            const data = await fetchSent();
            setSent(data);
        } catch {
            setErr("Gesendete Nachrichten konnten nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    async function loadRecipients() {
        try {
            const [users, grps] = await Promise.all([
                fetchRecipientOptions(),
                fetchGroupOptions().catch(() => []),
            ]);
            setRecipients(users);
            setGroups(grps);
        } catch {
            // ignore
        }
    }

    useEffect(() => {
        if (!open) return;
        setView("list");
        setTab("inbox");
        setDetail(null);
        loadInbox();
        loadRecipients();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        setView("list");
        setDetail(null);
        setErr("");
        if (tab === "inbox") loadInbox();
        else if (tab === "sent") loadSent();
    }, [tab]);

    async function openDetail(messageId: number, recipientRowId?: number) {
        setErr("");
        setLoading(true);
        try {
            const d = await fetchDetail(messageId);
            setDetail(d);
            setView("detail");

            if (recipientRowId && d.isRead === false) {
                await markRead(recipientRowId, true);
                setInbox((prev) =>
                    prev.map((item) =>
                        item.recipientRowId === recipientRowId ? { ...item, isRead: true } : item
                    )
                );
                onUnreadChange?.();
            }
        } catch {
            setErr("Nachricht konnte nicht geladen werden.");
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(recipientRowId: number) {
        try {
            await deleteFromInbox(recipientRowId);
            setInbox((prev) => prev.filter((i) => i.recipientRowId !== recipientRowId));
            if (view === "detail") {
                setView("list");
                setDetail(null);
            }
            onUnreadChange?.();
        } catch {
            setErr("Löschen fehlgeschlagen.");
        }
    }

    async function handleSend() {
        if (!subject.trim() || !body.trim() || (selectedRecipients.length === 0 && selectedGroups.length === 0)) return;
        setSending(true);
        setErr("");
        try {
            await sendMessage({
                subject: subject.trim(),
                body: body.trim(),
                recipientUserIds: selectedRecipients,
                recipientOrgUnitIds: selectedGroups.length > 0 ? selectedGroups : undefined,
            });
            setSubject("");
            setBody("");
            setSelectedRecipients([]);
            setSelectedGroups([]);
            setTab("sent");
        } catch {
            setErr("Senden fehlgeschlagen.");
        } finally {
            setSending(false);
        }
    }

    function toggleRecipient(id: number) {
        setSelectedRecipients((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    }

    function toggleGroup(id: number) {
        setSelectedGroups((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    }

    if (!open) return null;

    const canSend = subject.trim().length >= 1 && body.trim().length >= 1 && (selectedRecipients.length > 0 || selectedGroups.length > 0);

    return (
        <div className="fixed inset-0 z-50">
            <button
                aria-label="Schließen"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl border-l border-brand-border flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border shrink-0">
                    <div className="min-w-0">
                        <div className="text-lg font-extrabold text-brand-navy leading-tight">Nachrichten</div>
                        <div className="text-xs text-brand-text2">Internes Postfach</div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-xl border border-brand-border bg-white/80 hover:bg-brand-teal/15 transition grid place-items-center"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="px-5 pt-4 shrink-0">
                    <div className="inline-flex rounded-xl border border-brand-border bg-white/70 p-1 gap-1">
                        <TabBtn active={tab === "inbox"} onClick={() => { setTab("inbox"); }}>
                            <Inbox className="h-3.5 w-3.5" />
                            Posteingang
                        </TabBtn>
                        <TabBtn active={tab === "sent"} onClick={() => { setTab("sent"); }}>
                            <Send className="h-3.5 w-3.5" />
                            Gesendet
                        </TabBtn>
                        <TabBtn active={tab === "compose"} onClick={() => { setTab("compose"); setView("list"); }}>
                            <Plus className="h-3.5 w-3.5" />
                            Verfassen
                        </TabBtn>
                    </div>
                </div>

                {err && (
                    <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shrink-0">
                        {err}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {/* Detail view (inbox/sent) */}
                    {view === "detail" && detail && tab !== "compose" && (
                        <DetailView
                            detail={detail}
                            onBack={() => { setView("list"); setDetail(null); }}
                            onDelete={
                                detail.recipientRowId != null
                                    ? () => handleDelete(detail.recipientRowId!)
                                    : undefined
                            }
                            onReply={() => {
                                setSelectedRecipients([detail.senderId]);
                                setSelectedGroups([]);
                                setSubject(detail.subject.startsWith("Re:") ? detail.subject : `Re: ${detail.subject}`);
                                setBody("");
                                setTab("compose");
                                setView("list");
                            }}
                        />
                    )}

                    {/* Inbox list */}
                    {view === "list" && tab === "inbox" && (
                        <div className="space-y-2">
                            {loading && <p className="text-sm text-brand-text2">Lade…</p>}
                            {!loading && inbox.length === 0 && (
                                <EmptyState text="Keine Nachrichten im Posteingang." />
                            )}
                            {inbox.map((item) => (
                                <InboxRow
                                    key={item.recipientRowId}
                                    item={item}
                                    onClick={() => openDetail(item.message.id, item.recipientRowId)}
                                    onDelete={() => handleDelete(item.recipientRowId)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Sent list */}
                    {view === "list" && tab === "sent" && (
                        <div className="space-y-2">
                            {loading && <p className="text-sm text-brand-text2">Lade…</p>}
                            {!loading && sent.length === 0 && (
                                <EmptyState text="Keine gesendeten Nachrichten." />
                            )}
                            {sent.map((item) => (
                                <SentRow
                                    key={item.messageId}
                                    item={item}
                                    onClick={() => openDetail(item.messageId)}
                                />
                            ))}
                        </div>
                    )}

                    {/* Compose */}
                    {tab === "compose" && (
                        <div className="space-y-4">
                            {/* Group selection */}
                            {groups.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-brand-text2 block mb-1">
                                        Gruppen / Teams / Bereiche
                                    </label>
                                    <div className="rounded-xl border border-brand-border bg-white/80 max-h-32 overflow-y-auto divide-y divide-brand-border">
                                        {groups.map((g) => (
                                            <label
                                                key={g.id}
                                                className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-teal/10 transition"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedGroups.includes(g.id)}
                                                    onChange={() => toggleGroup(g.id)}
                                                    className="accent-brand-teal"
                                                />
                                                <span className="text-sm text-brand-navy">{g.label}</span>
                                                <span className="text-[10px] text-brand-text2 ml-auto">{g.type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Individual recipient selection */}
                            <div>
                                <label className="text-xs font-semibold text-brand-text2 block mb-1">
                                    Einzelne Empfänger
                                </label>
                                <div className="rounded-xl border border-brand-border bg-white/80 max-h-44 overflow-y-auto divide-y divide-brand-border">
                                    {recipients.length === 0 && (
                                        <p className="px-3 py-2 text-sm text-brand-text2">Lade Empfänger…</p>
                                    )}
                                    {recipients.map((r) => (
                                        <label
                                            key={r.id}
                                            className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-brand-teal/10 transition"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRecipients.includes(r.id)}
                                                onChange={() => toggleRecipient(r.id)}
                                                className="accent-brand-teal"
                                            />
                                            <span className="text-sm text-brand-navy">{r.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {(selectedRecipients.length > 0 || selectedGroups.length > 0) && (
                                    <p className="mt-1 text-xs text-brand-text2">
                                        {selectedRecipients.length > 0 && `${selectedRecipients.length} Einzelperson(en)`}
                                        {selectedRecipients.length > 0 && selectedGroups.length > 0 && " + "}
                                        {selectedGroups.length > 0 && `${selectedGroups.length} Gruppe(n)`}
                                        {" ausgewählt"}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-brand-text2 block mb-1">Betreff</label>
                                <input
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-brand-border bg-white/80 px-3 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25"
                                    placeholder="Betreff eingeben…"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-brand-text2 block mb-1">Nachricht</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={8}
                                    className="w-full rounded-xl border border-brand-border bg-white/80 px-3 py-2 text-sm shadow-sm outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25 resize-none"
                                    placeholder="Nachricht schreiben…"
                                />
                            </div>

                            <button
                                disabled={!canSend || sending}
                                onClick={handleSend}
                                className="inline-flex items-center justify-center gap-2 h-11 w-full rounded-xl bg-brand-teal text-white font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-95 active:scale-[0.99]"
                            >
                                <Send className="h-4 w-4" />
                                {sending ? "Sende…" : "Nachricht senden"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TabBtn({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                active
                    ? "bg-brand-teal/15 text-brand-navy"
                    : "text-brand-text2 hover:text-brand-navy"
            }`}
        >
            {children}
        </button>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-2xl border border-brand-border bg-brand-bg/60 p-4 text-sm text-brand-text2">
            {text}
        </div>
    );
}

function InboxRow({
    item,
    onClick,
    onDelete,
}: {
    item: InboxItem;
    onClick: () => void;
    onDelete: () => void;
}) {
    return (
        <div
            className={`group rounded-2xl border bg-white/80 p-3 shadow-sm cursor-pointer transition hover:shadow-md hover:border-brand-teal/30 ${
                item.isRead ? "border-brand-border" : "border-brand-teal/40 bg-brand-teal/5"
            }`}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {!item.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-teal" />
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 justify-between">
                        <span className={`text-sm truncate ${item.isRead ? "text-brand-text2" : "font-bold text-brand-navy"}`}>
                            {item.message.senderName ?? `#${item.message.senderId}`}
                        </span>
                        <span className="text-[11px] text-brand-text2 shrink-0">
                            {formatMessageDate(item.message.createdAt)}
                        </span>
                    </div>
                    <div className={`text-sm truncate mt-0.5 ${item.isRead ? "text-brand-text2" : "font-semibold text-brand-navy"}`}>
                        {item.message.subject}
                    </div>
                    <div className="text-xs text-brand-text2 mt-0.5 line-clamp-1">
                        {item.message.bodyPreview}
                    </div>
                </div>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="shrink-0 opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-lg border border-brand-border grid place-items-center hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                    title="Löschen"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}

function SentRow({ item, onClick }: { item: SentItem; onClick: () => void }) {
    return (
        <div
            className="rounded-2xl border border-brand-border bg-white/80 p-3 shadow-sm cursor-pointer transition hover:shadow-md hover:border-brand-teal/30"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-brand-text2 truncate">
                            An: {item.recipientNames ?? `${item.recipientCount} Empfänger`}
                        </span>
                        <span className="text-[11px] text-brand-text2 shrink-0">
                            {formatMessageDate(item.createdAt)}
                        </span>
                    </div>
                    <div className="text-sm font-semibold text-brand-navy truncate mt-0.5">{item.subject}</div>
                    <div className="text-xs text-brand-text2 mt-0.5 line-clamp-1">{item.bodyPreview}</div>
                </div>
            </div>
        </div>
    );
}

function DetailView({
    detail,
    onBack,
    onDelete,
    onReply,
}: {
    detail: MessageDetail;
    onBack: () => void;
    onDelete?: () => void;
    onReply: () => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="inline-flex items-center gap-1.5 text-sm text-brand-text2 hover:text-brand-navy transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Zurück
                </button>
            </div>

            <div className="rounded-2xl border border-brand-border bg-white/80 p-4 shadow-sm space-y-3">
                <div>
                    <h2 className="font-extrabold text-brand-navy text-base leading-tight">{detail.subject}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-brand-text2">
                        <span>Von: <span className="font-semibold text-brand-navy">{detail.senderName}</span></span>
                        <span>An: {detail.recipientNames.join(", ")}</span>
                        <span>{formatMessageDate(detail.createdAt)}</span>
                    </div>
                </div>

                <div className="border-t border-brand-border pt-3">
                    <p className="text-sm text-brand-navy whitespace-pre-wrap leading-relaxed">{detail.body}</p>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onReply}
                    className="inline-flex items-center gap-2 h-10 rounded-xl border border-brand-teal/40 bg-brand-teal/10 px-4 text-sm font-medium text-brand-navy hover:bg-brand-teal/20 transition"
                >
                    <CheckCheck className="h-4 w-4" />
                    Antworten
                </button>
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="inline-flex items-center gap-2 h-10 rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-600 hover:bg-red-100 transition"
                    >
                        <Trash2 className="h-4 w-4" />
                        Löschen
                    </button>
                )}
            </div>
        </div>
    );
}
