import type { InboxItem } from "@/lib/types";

async function asJson(res: Response) {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    const text = await res.text();
    try { return JSON.parse(text); } catch { return text; }
}

export async function fetchUnreadCount(): Promise<number> {
    const res = await fetch("/api/messages/unread-count", { credentials: "include" });
    if (!res.ok) return 0;
    const data = await asJson(res);
    return Number((data as any).count ?? 0);
}

export async function fetchInbox(limit = 50): Promise<InboxItem[]> {
    const res = await fetch(`/api/messages/inbox?limit=${limit}`, { credentials: "include" });
    if (!res.ok) throw new Error("Inbox fetch failed");
    const data = await asJson(res);
    return ((data as any).items ?? data) as InboxItem[];
}

export async function markRead(recipientRowId: number, isRead: boolean) {
    const res = await fetch("/api/messages/mark-read", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recipientRowId, isRead }),
    });
    if (!res.ok) throw new Error("Mark read failed");
}

export async function sendMessage(payload: {
    subject: string;
    body: string;
    recipientUserIds: number[];
    threadId?: number | null;
}) {
    const res = await fetch("/api/messages/send", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Send failed");
}
export type RecipientOption = {
    id: number;
    label: string;
};

export async function fetchRecipientOptions(
    q = ""
): Promise<RecipientOption[]> {
    const res = await fetch(
        `/api/messages/recipient-options?q=${encodeURIComponent(q)}`,
        { credentials: "include" }
    );

    if (!res.ok) throw new Error("Recipient fetch failed");

    return res.json();
}