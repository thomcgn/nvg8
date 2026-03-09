import { apiFetch } from "@/lib/api";

export type MessageDto = {
    id: number;
    subject: string;
    bodyPreview: string;
    createdAt: string;
    senderId: number;
    senderName: string | null;
};

export type InboxItem = {
    recipientRowId: number;
    isRead: boolean;
    readAt: string | null;
    message: MessageDto;
};

export type SentItem = {
    messageId: number;
    subject: string;
    bodyPreview: string;
    createdAt: string;
    recipientCount: number;
    recipientNames: string | null;
};

export type MessageDetail = {
    messageId: number;
    subject: string;
    body: string;
    createdAt: string;
    senderId: number;
    senderName: string;
    recipientRowId: number | null;
    isRead: boolean | null;
    recipientNames: string[];
};

export type UserOption = {
    id: number;
    label: string;
};

export function fetchInbox(limit = 50): Promise<InboxItem[]> {
    return apiFetch<InboxItem[]>(`/messages/inbox?limit=${limit}`);
}

export function fetchSent(limit = 50): Promise<SentItem[]> {
    return apiFetch<SentItem[]>(`/messages/sent?limit=${limit}`);
}

export function fetchDetail(messageId: number): Promise<MessageDetail> {
    return apiFetch<MessageDetail>(`/messages/detail/${messageId}`);
}

export function fetchRecipientOptions(): Promise<UserOption[]> {
    return apiFetch<UserOption[]>("/messages/recipient-options");
}

export function sendMessage(data: {
    subject: string;
    body: string;
    recipientUserIds: number[];
    threadId?: number | null;
}): Promise<void> {
    return apiFetch("/messages/send", { method: "POST", body: JSON.stringify(data) });
}

export function markRead(recipientRowId: number, isRead: boolean): Promise<void> {
    return apiFetch("/messages/mark-read", {
        method: "POST",
        body: JSON.stringify({ recipientRowId, isRead }),
    });
}

export function deleteFromInbox(recipientRowId: number): Promise<void> {
    return apiFetch(`/messages/recipient/${recipientRowId}`, { method: "DELETE" });
}

export function formatMessageDate(createdAt: string): string {
    try {
        const d = new Date(createdAt);
        const now = new Date();
        const sameDay =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate();
        if (sameDay) {
            return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
        }
        return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" });
    } catch {
        return "";
    }
}
