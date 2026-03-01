import { apiFetch } from "@/lib/api";

export type AkteFallListItem = {
    id: number;
    status: string;
    titel: string | null;
    aktenzeichen: string;
    dossierId: number;
    kindId: number;
    kindName: string;
    einrichtungOrgUnitId: number;
    teamOrgUnitId: number | null;
    createdByDisplayName: string | null;
    createdAt: string | null;
};

export type AkteResponse = {
    akteId: number;
    kindId: number;
    kindName: string;
    enabled: boolean;
    faelle: AkteFallListItem[];
};

export type CreateFallInAkteRequest = {
    titel?: string | null;
    kurzbeschreibung?: string | null;
};

export const akteApi = {
    getOrCreateByKind: (kindId: number) =>
        apiFetch<AkteResponse>(`/kinder/${kindId}/akte`, { method: "GET" }),

    get: (akteId: number) =>
        apiFetch<AkteResponse>(`/akten/${akteId}`, { method: "GET" }),

    createFall: (akteId: number, req?: CreateFallInAkteRequest | null) =>
        apiFetch<{ id: number } & Record<string, any>>(`/akten/${akteId}/faelle`, {
            method: "POST",
            body: req ?? null,
        }),
};