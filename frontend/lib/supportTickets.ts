// lib/supportTickets.ts
import { apiFetch } from "@/lib/api";

export type TicketCategory = "TEAMS_FORM" | "LOGIN" | "OTHER";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH";

// Optional: falls du Status typisieren willst
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CLOSED";

export type SupportTicket = {
    id: number;
    title: string;
    description: string;
    category: TicketCategory | string;
    priority: TicketPriority | string;
    status: TicketStatus | string;
    pageUrl?: string | null;
    githubIssueNumber?: number | null;
    githubIssueUrl?: string | null;
    createdAt?: string;
};

export type CreateSupportTicketRequest = {
    title: string;
    description: string;
    category: TicketCategory;
    priority: TicketPriority;
    pageUrl?: string;
    userAgent?: string;
};

// Backend endpoints:
export async function createSupportTicket(payload: CreateSupportTicketRequest) {
    // wichtig: führender Slash, damit apiFetch sauber normalisiert
    return apiFetch<SupportTicket>("/support/tickets", {
        method: "POST",
        body: payload, // apiFetch json-stringified selbst
    });
}

/**
 * Liste deiner Tickets
 * Backend: GET /support/tickets/my
 */
export async function fetchMyTickets(): Promise<SupportTicket[]> {
    return apiFetch<SupportTicket[]>("/support/tickets/my", {
        method: "GET",
    });
}

/**
 * Count deiner offenen Tickets
 * Backend: GET /support/tickets/my/count?status=OPEN
 */
export async function fetchMyOpenTicketsCount(): Promise<number> {
    const r = await apiFetch<{ count: number }>("/support/tickets/my/count?status=OPEN", {
        method: "GET",
    });
    return r.count;
}