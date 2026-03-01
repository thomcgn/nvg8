import { apiFetch } from "@/lib/api";

export type TraegerRiskIndicator = {
    id: number;
    indicatorId: string;
    label: string;
    description: string | null;
    category: string | null;
    enabled: boolean;
    sortOrder: number;
    defaultSeverity: number | null;
};

export type CreateTraegerRiskIndicatorRequest = {
    indicatorId: string;
    label: string;
    description?: string | null;
    category?: string | null;
    enabled?: boolean | null;
    defaultSeverity?: number | null;
};

export type UpdateTraegerRiskIndicatorRequest = {
    indicatorId?: string | null;
    label?: string | null;
    description?: string | null;
    category?: string | null;
    enabled?: boolean | null;
    defaultSeverity?: number | null;
};

export const riskIndicatorsApi = {
    listForMe() {
        return apiFetch<TraegerRiskIndicator[]>("/traeger/me/risk-indicators", { method: "GET" });
    },

    adminList(traegerId: number) {
        return apiFetch<TraegerRiskIndicator[]>(`/admin/traeger/${traegerId}/risk-indicators`, { method: "GET" });
    },

    adminCreate(traegerId: number, body: CreateTraegerRiskIndicatorRequest) {
        return apiFetch<TraegerRiskIndicator>(`/admin/traeger/${traegerId}/risk-indicators`, {
            method: "POST",
            body,
        });
    },

    adminUpdate(traegerId: number, id: number, body: UpdateTraegerRiskIndicatorRequest) {
        return apiFetch<TraegerRiskIndicator>(`/admin/traeger/${traegerId}/risk-indicators/${id}`, {
            method: "PUT",
            body,
        });
    },

    adminDelete(traegerId: number, id: number) {
        return apiFetch<void>(`/admin/traeger/${traegerId}/risk-indicators/${id}`, {
            method: "DELETE",
        });
    },

    adminReorder(traegerId: number, orderedIds: number[]) {
        return apiFetch<TraegerRiskIndicator[]>(`/admin/traeger/${traegerId}/risk-indicators/reorder`, {
            method: "PUT",
            body: { orderedIds },
        });
    },
};