import { apiFetch } from "@/lib/api";

export type AnlasskatalogEntry = {
    id: number;
    code: string;
    label: string;
    category: string | null;
    defaultSeverity: number | null;
};

export type AnlasskatalogSimilarResponse = {
    exactMatch: boolean;
    similar: AnlasskatalogEntry[];
};

export type CreateAnlasskatalogEntryRequest = {
    code: string;
    label: string;
    category?: string | null;
    defaultSeverity?: number | null;
};

export const anlassCatalogApi = {
    list(): Promise<AnlasskatalogEntry[]> {
        return apiFetch<AnlasskatalogEntry[]>("/anlass-catalog", { method: "GET" });
    },

    similar(params: { label?: string; code?: string }): Promise<AnlasskatalogSimilarResponse> {
        const q = new URLSearchParams();
        if (params.label) q.set("label", params.label);
        if (params.code) q.set("code", params.code);
        return apiFetch<AnlasskatalogSimilarResponse>(`/anlass-catalog/similar?${q.toString()}`, { method: "GET" });
    },

    create(req: CreateAnlasskatalogEntryRequest): Promise<AnlasskatalogEntry> {
        return apiFetch<AnlasskatalogEntry>("/anlass-catalog", { method: "POST", body: req });
    },
};
